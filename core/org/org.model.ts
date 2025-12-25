import { UserRoleInOrg } from '@/lib/action-policies';
import { BaseEntity } from '@/lib/firestore-repository/types';
import { z } from 'zod';

// --- Organization ---
export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  ownerId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Organization = z.infer<typeof OrganizationSchema> & BaseEntity;

export const CreateOrgSchema = z.object({
  name: z.string().min(2).max(50),
});
export const UpdateOrgSchema = CreateOrgSchema.partial();
export type CreateOrgInput = z.infer<typeof CreateOrgSchema>;
export type UpdateOrgInput = z.infer<typeof UpdateOrgSchema>;

// --- Invites ---
export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED', // Added REJECTED
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export const InviteSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRoleInOrg).default(UserRoleInOrg.MEMBER),
  token: z.string(),
  inviterId: z.string(),
  status: z.nativeEnum(InviteStatus).default(InviteStatus.PENDING),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Invite = z.infer<typeof InviteSchema> & BaseEntity;

export const SendInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRoleInOrg).default(UserRoleInOrg.MEMBER),
});
export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
});
export const RejectInviteSchema = z.object({
  token: z.string().min(1),
});
export const RevokeInviteSchema = z.object({
  inviteId: z.string(),
});

// --- Members (Logic Support) ---
export const UpdateMemberRoleSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(UserRoleInOrg),
});
export const RemoveMemberSchema = z.object({
  userId: z.string(),
});
