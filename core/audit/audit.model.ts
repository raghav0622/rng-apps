import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

export enum AuditAction {
  // Auth
  LOGIN = 'auth.login',

  // Org
  ORG_UPDATE = 'org.update',

  // Members
  MEMBER_INVITE = 'member.invite',
  MEMBER_UPDATE_ROLE = 'member.update_role',
  MEMBER_REMOVE = 'member.remove',
  
  // Invites
  INVITE_ACCEPT = 'invite.accept',
  INVITE_REJECT = 'invite.reject',
  INVITE_REVOKE = 'invite.revoke',

  // Generic
  RESOURCE_CREATE = 'resource.create',
  RESOURCE_UPDATE = 'resource.update',
  RESOURCE_DELETE = 'resource.delete',
}

export const AuditLogSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  actorId: z.string(), // User who performed the action
  action: z.nativeEnum(AuditAction),

  targetId: z.string().optional(), // ID of the object being acted upon (e.g., user ID, invoice ID)
  metadata: z.record(z.string(), z.any()).optional(), // Changed fields, diffs, etc.

  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type AuditLog = z.infer<typeof AuditLogSchema> & BaseEntity;
