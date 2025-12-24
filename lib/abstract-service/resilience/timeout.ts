// core/lib/resilience/timeout.ts

/**
 * Wraps a promise and rejects if it takes longer than the specified duration.
 *
 * @template T
 * @param {Promise<T>} promise - The async operation to monitor.
 * @param {number} ms - The timeout duration in milliseconds.
 * @param {string} operationName - Name used in the error message for debugging.
 * @returns {Promise<T>} The result of the promise if it completes in time.
 * @throws {Error} If the timeout is exceeded.
 *
 * @example
 * await withTimeout(fetchData(), 5000, 'FetchData');
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  operationName: string,
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: ${operationName} exceeded ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
