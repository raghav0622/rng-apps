import { BaseEntity, OrgScoped } from '@/lib/types';
import { z } from 'zod';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

export interface AuditLog extends BaseEntity, OrgScoped {
  action: AuditAction | string;
  resource: string;
  resourceId: string;
  actorId: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  traceId: string;
}

export const CreateAuditLogSchema = z.object({
  action: z.string(),
  resource: z.string(),
  resourceId: z.string(),
  orgId: z.string(),
  actorId: z.string(),
  actorEmail: z.string().optional(),
  traceId: z.string(),
  // FIX: Explicitly define key type as string for Zod v4 compatibility
  metadata: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;
