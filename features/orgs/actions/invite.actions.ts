'use server';

import { AppPermission } from '@/lib/action-policies';
import { authActionClient, orgActionClient } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { CreateInviteSchema, RespondInviteSchema } from '../invite.model';
import { InviteService } from '../services/invite.service';

// ----------------------------------------------------------------------------
// Create Invite (Admin/Owner Only)
// ----------------------------------------------------------------------------
export const createInviteAction = orgActionClient
  .metadata({
    name: 'invites.create',
    permissions: [AppPermission.MEMBER_INVITE],
  })
  .inputSchema(CreateInviteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await InviteService.createInvite(
      ctx.userId,
      ctx.orgId,
      parsedInput.email,
      parsedInput.role,
    );

    if (result.success) {
      revalidatePath('/dashboard/team');
    }
    return result;
  });

// ----------------------------------------------------------------------------
// Get My Invites (Any Authenticated User)
// ----------------------------------------------------------------------------
export const getMyInvitesAction = authActionClient
  .metadata({ name: 'invites.listMine' })
  .action(async ({ ctx }) => {
    // Only fetch if user has an email
    if (!ctx.email) return { success: true, data: [] };
    return await InviteService.getMyInvites(ctx.email);
  });

// ----------------------------------------------------------------------------
// Respond to Invite (Accept/Reject)
// ----------------------------------------------------------------------------
export const respondToInviteAction = authActionClient
  .metadata({ name: 'invites.respond' })
  .inputSchema(RespondInviteSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (!ctx.email) throw new Error('Email required to process invites.');

    const result = await InviteService.respondToInvite(
      ctx.userId,
      ctx.email,
      parsedInput.inviteId,
      parsedInput.accept,
    );

    if (result.success) {
      revalidatePath('/dashboard'); // Refresh to show new org state
    }
    return result;
  });
