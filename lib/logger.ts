/* eslint-disable no-console */

/**
 * Logs an informational message to the console.
 * Only outputs in development environments to avoid cluttering production logs,
 * unless configured otherwise by the runtime environment.
 *
 * @param {string} message - The main log message.
 * @param {Record<string, unknown>} [metadata={}] - Optional key-value pairs to provide context.
 *
 * @example
 * logInfo('User logged in', { userId: '12345' });
 */
export const logInfo = (message: string, metadata: Record<string, unknown> = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.info(`ℹ️ [INFO]: ${message}`, metadata);
  }
};

/**
 * Logs an error message to the console.
 * This is always output regardless of the environment.
 *
 * @param {string} message - The error description.
 * @param {Record<string, unknown>} [metadata={}] - Optional context about the error (stack trace, inputs, etc).
 *
 * @example
 * logError('Database connection failed', { host: 'localhost', retryCount: 3 });
 */
export const logError = (message: string, metadata: Record<string, unknown> = {}) => {
  console.error(`🚨 [ERROR]: ${message}`, metadata);
};

/**
 * Logs a debug message to the console.
 * Strictly limited to development environments.
 *
 * @param {string} message - The debug note.
 * @param {Record<string, unknown>} [metadata={}] - distinct data points for debugging.
 *
 * @example
 * logDebug('Payload received', { size: '2kb', endpoint: '/api/test' });
 */
export const logDebug = (message: string, metadata: Record<string, unknown> = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`🐛 [DEBUG]: ${message}`, metadata);
  }
};
