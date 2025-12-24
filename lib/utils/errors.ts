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
}

export interface AppError {
  code: AppErrorCode;
  message: string;
  traceId?: string;
  details?: Record<string, unknown>;
}

export class CustomError extends Error {
  public readonly code: AppErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: AppErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }

  toAppError(traceId?: string): AppError {
    return {
      code: this.code,
      message: this.message,
      traceId,
      details: this.details,
    };
  }
}
