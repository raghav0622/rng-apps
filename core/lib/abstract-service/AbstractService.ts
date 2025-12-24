// core/lib/abstract-service.ts
import 'server-only';

import { logError, logInfo } from '@/lib/logger';
import { Result } from '../types';
import { AppError, AppErrorCode, CustomError } from '../utils/errors';
import { checkRateLimit } from '../utils/rate-limit';
import { getTraceId } from '../utils/tracing';
import { CircuitBreaker } from './resilience/circuit-breaker';
import { getIdempotencyRecord, saveIdempotencyRecord } from './resilience/idempotency';
import { withTimeout } from './resilience/timeout';

export abstract class AbstractService {
  private static breakers = new Map<string, CircuitBreaker>();
  private readonly DEFAULT_TIMEOUT = 15000;

  protected async handleOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    options?: {
      timeoutMs?: number;
      skipRateLimit?: boolean;
      idempotencyKey?: string; // New: Unique key for the request
    },
  ): Promise<Result<T>> {
    const traceId = getTraceId();
    const startTime = performance.now();

    if (!AbstractService.breakers.has(operationName)) {
      AbstractService.breakers.set(operationName, new CircuitBreaker());
    }
    const breaker = AbstractService.breakers.get(operationName)!;

    try {
      // 1. Idempotency Check: Return cached result if we've seen this key before
      if (options?.idempotencyKey) {
        const cachedResult = await getIdempotencyRecord(options.idempotencyKey);
        if (cachedResult) {
          logInfo(`[IDEMPOTENCY_HIT] ${operationName}`, { traceId, key: options.idempotencyKey });
          return { success: true, data: cachedResult as T };
        }
      }

      // 2. Security: Rate Limiting
      if (!options?.skipRateLimit) {
        await checkRateLimit();
      }

      // 3. Execution: Circuit Breaker + Timeout
      const data = await breaker.execute(async () => {
        return await withTimeout(
          operation(),
          options?.timeoutMs ?? this.DEFAULT_TIMEOUT,
          operationName,
        );
      });

      // 4. Save for Idempotency: Cache successful result
      if (options?.idempotencyKey) {
        await saveIdempotencyRecord(options.idempotencyKey, data);
      }

      const duration = (performance.now() - startTime).toFixed(2);
      logInfo(`[SERVICE_SUCCESS] ${operationName}`, { traceId, duration: `${duration}ms` });

      return { success: true, data };
    } catch (error: any) {
      return this.handleGlobalError(error, operationName, traceId, startTime);
    }
  }

  private handleGlobalError(
    error: any,
    opName: string,
    traceId: string,
    start: number,
  ): Result<any> {
    const duration = (performance.now() - start).toFixed(2);
    logError(`Service Error [${opName}]`, { traceId, error: error.message, duration });

    if (error instanceof CustomError) {
      return { success: false, error: error.toAppError(traceId) };
    }

    // Default Error Mapping
    const appError: AppError = {
      code: error.message?.includes('CIRCUIT') ? AppErrorCode.INTERNAL_ERROR : AppErrorCode.UNKNOWN,
      message: error.message || 'An internal error occurred.',
      traceId,
      details: { duration: `${duration}ms` },
    };

    return { success: false, error: appError };
  }
}
