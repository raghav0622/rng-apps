import { UserRoleInOrg } from '@/features/enums';
import { BaseEntity } from '@/lib/types';
import { z } from 'zod';

// ----------------------------------------------------------------------------
// Zod Schemas
// ----------------------------------------------------------------------------

export const CreateInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRoleInOrg).refine((role) => role !== UserRoleInOrg.OWNER, {
    message: 'Cannot invite someone as Owner directly. Transfer ownership instead.',
  }),
});

export const RespondInviteSchema = z.object({
  inviteId: z.string(),
  accept: z.boolean(),
});

// ----------------------------------------------------------------------------
// Domain Types
// ----------------------------------------------------------------------------

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface OrgInvite extends BaseEntity {
  email: string;
  orgId: string;
  orgName: string; // Denormalized for UI display
  role: UserRoleInOrg;
  invitedBy: string; // User ID of the inviter
  status: InviteStatus;
  respondedAt?: Date;
}
