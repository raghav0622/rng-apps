// lib/types.ts
// FIX: Use 'import type' to avoid runtime import of firebase-admin
import type { Timestamp } from 'firebase-admin/firestore';
import { AppError } from './errors';

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

export interface OrgScopedBaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export type AuthContext = {
  userId: string;
};

export type OrgContext = {
  orgId: string;
  userId: string;
  role: string;
};

export type TracingContext = {
  traceId: string;
};
