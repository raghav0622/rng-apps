import { UserRoleInOrg } from '@/lib/action-policies';
import { BaseEntity } from '@/lib/firestore-repository/types';
import { z } from 'zod';

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

/**
 * 📩 Invite Entity
 */
export const InviteSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRoleInOrg).default(UserRoleInOrg.MEMBER),

  // Security
  token: z.string(), // Secure random token for the link
  inviterId: z.string(), // Who sent it
  status: z.nativeEnum(InviteStatus).default(InviteStatus.PENDING),
  expiresAt: z.date(),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Invite = z.infer<typeof InviteSchema> & BaseEntity;

/**
 * Input for sending an invite.
 */
export const SendInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRoleInOrg).default(UserRoleInOrg.MEMBER),
});

export type SendInviteInput = z.infer<typeof SendInviteSchema>;

/**
 * Input for accepting an invite.
 */
export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
});
