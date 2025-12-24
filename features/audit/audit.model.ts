import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export enum AuditAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',

  // Resources
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',

  // Specifics
  INVITE_SENT = 'INVITE_SENT',
  INVITE_ACCEPTED = 'INVITE_ACCEPTED',
  INVITE_REJECTED = 'INVITE_REJECTED',
  MEMBER_ROLE_CHANGE = 'MEMBER_ROLE_CHANGE',
  MEMBER_REMOVE = 'MEMBER_REMOVE',
}

export interface AuditLog {
  id: string;
  orgId: string;
  actorId: string;
  actorEmail?: string; // Snapshot for display even if user is deleted
  action: AuditAction;
  targetResource: string; // e.g., 'member', 'organization', 'billing'
  targetId?: string; // ID of the specific item changed
  details: Record<string, unknown>; // Diff or metadata
  ip?: string;
  userAgent?: string;
  traceId?: string;
  createdAt: Timestamp;
}

export const zAuditLog = z.object({
  id: z.string(),
  orgId: z.string(),
  actorId: z.string(),
  action: z.nativeEnum(AuditAction),
  targetResource: z.string(),
  details: z.record(z.string(), z.unknown()),
});
