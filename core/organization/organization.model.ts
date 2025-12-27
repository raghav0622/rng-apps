import { UserRoleInOrg } from '@/lib/action-policies';
import { BaseEntity } from '@/lib/firestore-repository/types';
import { z } from 'zod';

// --- Organization ---
export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  ownerId: z.string(),
  
  // Ownership Transfer (Pending Offer)
  pendingOwnerId: z.string().optional().nullable(),
  transferExpiresAt: z.date().optional().nullable(),

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

// --- Members ---
export const MemberSchema = z.object({
  id: z.string(), // Matches userId
  orgId: z.string(),
  userId: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  role: z.nativeEnum(UserRoleInOrg),
  joinedAt: z.date(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Member = z.infer<typeof MemberSchema> & BaseEntity;

// --- Invites ---
export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
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

// --- Actions ---
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

export const UpdateMemberRoleSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(UserRoleInOrg),
});

export const RemoveMemberSchema = z.object({
  userId: z.string(),
});

// --- Ownership Transfer Actions ---
export const OfferOwnershipSchema = z.object({
  targetUserId: z.string(),
});

export const AcceptOwnershipSchema = z.object({}); // No payload, just context
