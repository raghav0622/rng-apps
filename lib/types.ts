// lib/types.ts
// FIX: Use 'import type' to avoid runtime import of firebase-admin
import type { Timestamp } from 'firebase-admin/firestore';
import { AppError } from '../core/utils/errors';

export type SuccessResult<T> = {
  success: true;
  data: T;
};

export type ErrorResult = {
  success: false;
  error: AppError;
};

export type Result<T> = SuccessResult<T> | ErrorResult;

export interface OrgScoped {
  orgId: string;
}

export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export interface OrgScopedBaseEntity extends BaseEntity {
  orgId: string;
}

// Standardized Server Action Response
export type ActionResponse<T> = { success: true; data: T } | { success: false; error: AppError };

export type AuthContext = {
  userId: string;
  email?: string;
};

export type OrgContext = AuthContext & {
  orgId: string;
  role: string;
};

export type TracingContext = {
  traceId: string;
};
