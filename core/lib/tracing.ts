import { AsyncLocalStorage } from 'async_hooks';
import { nanoid } from 'nanoid';
import 'server-only';

export const TRACE_ID_HEADER = 'x-trace-id';

// Storage for the current trace ID
const traceStorage = new AsyncLocalStorage<string>();

/**
 * Generates a unique trace ID for the request/action.
 */
export function generateTraceId(): string {
  return nanoid();
}

/**
 * Runs a callback within a tracing context.
 */
export function withTraceId<T>(traceId: string, callback: () => T): T {
  return traceStorage.run(traceId, callback);
}

/**
 * Retrieves the current trace ID, or generates a new one if none exists.
 */
export function getTraceId(): string {
  const store = traceStorage.getStore();
  if (store) return store;

  // Fallback if accessed outside a wrapped context (e.g. startup scripts)
  return `fallback-${generateTraceId()}`;
}
