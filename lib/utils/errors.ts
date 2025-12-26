export enum AppErrorCode {
  UNKNOWN = 'UNKNOWN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  DB_ERROR = 'DB_ERROR', // Added as requested
  ORGANIZATION_REQUIRED = 'ORGANIZATION_REQUIRED',
  ORG_ACCESS_DENIED = 'ORG_ACCESS_DENIED',
  INVALID_INPUT = 'INVALID_INPUT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  PRECONDITION_FAILED = 'PRECONDITION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface AppError {
  code: AppErrorCode;
  message: string;
  traceId?: string;
  details?: Record<string, unknown>;
}

/**
 * Custom Error class for handling application-specific exceptions.
 * It extends the native Error class and adds an error code and optional details.
 */
export class CustomError extends Error {
  public readonly code: AppErrorCode;
  public readonly details?: Record<string, unknown>;

  /**
   * Creates a new CustomError instance.
   *
   * @param {AppErrorCode} code - The specific application error code.
   * @param {string} message - A human-readable error message.
   * @param {Record<string, unknown>} [details] - Optional additional context for the error.
   *
   * @example
   * throw new CustomError(AppErrorCode.NOT_FOUND, 'User not found', { userId: '123' });
   */
  constructor(code: AppErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }

  /**
   * Converts the CustomError into a plain object (AppError) suitable for API responses.
   *
   * @param {string} [traceId] - The tracing ID associated with the current request.
   * @returns {AppError} A standardized error object.
   *
   * @example
   * const appError = error.toAppError('trace-abc-123');
   * console.log(appError.code); // 'NOT_FOUND'
   */
  toAppError(traceId?: string): AppError {
    return {
      code: this.code,
      message: this.message,
      traceId,
      details: this.details,
    };
  }
}
