import { AsyncLocalStorage } from 'async_hooks';
import { nanoid } from 'nanoid';
import 'server-only';

export const TRACE_ID_HEADER = 'x-trace-id';

// Storage for the current trace ID
const traceStorage = new AsyncLocalStorage<string>();

/**
 * Generates a unique trace ID for the request/action.
 * Uses nanoid for URL-friendly unique strings.
 *
 * @returns {string} A unique ID string.
 *
 * @example
 * const id = generateTraceId(); // "V1StGXR8_Z5jdHi6B-myT"
 */
export function generateTraceId(): string {
  return nanoid();
}

/**
 * Runs a callback within a tracing context.
 * Any calls to `getTraceId()` inside the callback (or functions called by it)
 * will retrieve the `traceId` provided here.
 *
 * @template T
 * @param {string} traceId - The trace ID to store in the context.
 * @param {() => T} callback - The function to execute within the context.
 * @returns {T} The result of the callback.
 *
 * @example
 * const result = withTraceId('trace-123', () => {
 * return doSomething(); // doSomething can access 'trace-123'
 * });
 */
export function withTraceId<T>(traceId: string, callback: () => T): T {
  return traceStorage.run(traceId, callback);
}

/**
 * Retrieves the current trace ID, or generates a new one if none exists.
 * Useful for logging or passing correlation IDs to downstream services.
 *
 * @returns {string} The active trace ID or a fallback generated ID.
 *
 * @example
 * const traceId = getTraceId();
 * logInfo('Processing request', { traceId });
 */
export function getTraceId(): string {
  const store = traceStorage.getStore();
  if (store) return store;

  // Fallback if accessed outside a wrapped context (e.g. startup scripts)
  return `fallback-${generateTraceId()}`;
}
