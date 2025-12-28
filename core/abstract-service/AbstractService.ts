// core/lib/abstract-service.ts
import 'server-only';

import { logError, logInfo } from '@/lib/logger';
import { Result } from '../../lib/types';
import { AppError, AppErrorCode, CustomError } from '../utils/errors';
import { checkRateLimit } from '../utils/rate-limit';
import { getTraceId } from '../utils/tracing';
import { CircuitBreaker } from './resilience/circuit-breaker';
import { getIdempotencyRecord, saveIdempotencyRecord } from './resilience/idempotency';
import { withTimeout } from './resilience/timeout';

/**
 * The base class for all domain services.
 * It wraps business logic with cross-cutting concerns:
 * 1. **Tracing**: Automatically logs operations with trace IDs.
 * 2. **Resilience**: Circuit Breaking and Timeouts.
 * 3. **Idempotency**: Prevents duplicate execution of sensitive operations.
 * 4. **Rate Limiting**: Protects downstream resources.
 * 5. **Error Handling**: Standardizes error responses into `Result<T>`.
 */
export abstract class AbstractService {
  private static breakers = new Map<string, CircuitBreaker>();
  private readonly DEFAULT_TIMEOUT = 15000;

  /**
   * Executes a service operation with built-in safety mechanisms.
   *
   * @template T - The expected return type of the operation.
   * @param {string} operationName - A unique name for the operation (used for metrics and circuit breaking).
   * @param {() => Promise<T>} operation - The async business logic to execute.
   * @param {Object} [options] - Configuration for this execution.
   * @param {number} [options.timeoutMs] - Max duration before throwing a Timeout Error (default 15s).
   * @param {boolean} [options.skipRateLimit] - If true, bypasses the rate limiter (e.g., for internal background jobs).
   * @param {string} [options.idempotencyKey] - Unique key. If provided, checks cache for previous results to avoid re-execution.
   *
   * @returns {Promise<Result<T>>} A standardized success/failure result object.
   *
   * @example
   * class PaymentService extends AbstractService {
   * async charge(amount: number) {
   * return this.handleOperation('charge-card', async () => {
   * return await stripe.charges.create({ amount });
   * }, { idempotencyKey: 'order-123' });
   * }
   * }
   */
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
