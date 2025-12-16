// lib/errors.ts

/**
 * Custom application error codes for consistent handling and localization.
 * Every error returned from the server must map to one of these codes.
 */
export enum AppErrorCode {
  // General Errors
  UNKNOWN = 'UNKNOWN',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Authentication/Authorization Errors
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Organization/Single-Tenancy Errors
  ORGANIZATION_REQUIRED = 'ORGANIZATION_REQUIRED',
  SINGLE_TENANCY_VIOLATION = 'SINGLE_TENANCY_VIOLATION',
  ORG_ACCESS_DENIED = 'ORG_ACCESS_DENIED',
  ORG_CREATION_BLOCKED = 'ORG_CREATION_BLOCKED',

  FEATURE_DISABLED = 'FEATURE_DISABLED',
  FORBIDDEN = 'FORBIDDEN',
}

/**
 * The standardized structure for all application errors.
 * This ensures API failures always provide a structured, traceable error.
 */
export type AppError = {
  code: AppErrorCode;
  message: string;
  traceId?: string;
  details?: Record<string, unknown>;
};

/**
 * Custom base error class for throw-able errors within the service layer.
 */
export class CustomError extends Error {
  public readonly code: AppErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(code: AppErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  toAppError(traceId: string): AppError {
    return {
      code: this.code,
      message: this.message,
      traceId,
      details: this.details,
    };
  }
}
