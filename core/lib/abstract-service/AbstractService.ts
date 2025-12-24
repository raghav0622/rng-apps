// core/lib/abstract-service.ts
import 'server-only';

import { logError, logInfo } from '@/lib/logger';
import { Result } from '../types';
import { AppError, AppErrorCode, CustomError } from '../utils/errors';
import { checkRateLimit } from '../utils/rate-limit';
import { getTraceId } from '../utils/tracing';
import { CircuitBreaker } from './resilience/circuit-breaker';
import { withTimeout } from './resilience/timeout';

export abstract class AbstractService {
  // Static registry keeps circuit states alive across service instantiations
  private static breakers = new Map<string, CircuitBreaker>();
  private readonly DEFAULT_TIMEOUT = 15000; // 15 seconds

  protected async handleOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    options?: { timeoutMs?: number; skipRateLimit?: boolean },
  ): Promise<Result<T>> {
    const traceId = getTraceId();
    const startTime = performance.now();

    // Get or create breaker for this specific service operation
    if (!AbstractService.breakers.has(operationName)) {
      AbstractService.breakers.set(operationName, new CircuitBreaker());
    }
    const breaker = AbstractService.breakers.get(operationName)!;

    try {
      // 1. Security Pillar: Rate Limiting
      if (!options?.skipRateLimit) {
        await checkRateLimit();
      }

      // 2. Resilience Pillar: Circuit Breaker + Timeout
      const data = await breaker.execute(async () => {
        return await withTimeout(
          operation(),
          options?.timeoutMs ?? this.DEFAULT_TIMEOUT,
          operationName,
        );
      });

      // 3. Observability Pillar: Success Logging
      const duration = (performance.now() - startTime).toFixed(2);
      logInfo(`[SERVICE_SUCCESS] ${operationName}`, { traceId, duration: `${duration}ms` });

      return { success: true, data };
    } catch (error: any) {
      const duration = (performance.now() - startTime).toFixed(2);

      // 4. Error Mapping & Obfuscation
      logError(`Service Error [${operationName}] after ${duration}ms`, {
        traceId,
        error: error instanceof Error ? error.message : error,
        operation: operationName,
      });

      // Handle Known Business/Custom Errors
      if (error instanceof CustomError) {
        return { success: false, error: error.toAppError(traceId) };
      }

      // Handle Specific System Failures (Circuit/Timeout)
      let errorCode = AppErrorCode.INTERNAL_ERROR;
      let message = error.message || 'An internal service error occurred.';

      if (message.includes('CIRCUIT_OPEN')) {
        errorCode = AppErrorCode.INTERNAL_ERROR; // Or a specific SHUTDOWN code
        message = 'Service is temporarily overloaded. Please try again in 30s.';
      } else if (message.includes('Timeout')) {
        errorCode = AppErrorCode.INTERNAL_ERROR;
        message = 'The operation timed out. Please try again.';
      } else if (message.includes('Too many attempts')) {
        errorCode = AppErrorCode.TOO_MANY_REQUESTS;
      }

      const appError: AppError = {
        code: errorCode,
        message,
        traceId,
        details: { duration: `${duration}ms` },
      };

      return { success: false, error: appError };
    }
  }
}
