'use server';

import { authActionClient, orgActionClient } from '@/core/safe-action/safe-action';
import { AppPermission } from '@/lib/action-policies';
import { AcceptInviteSchema, SendInviteSchema } from './invite.model';
import { inviteService } from './invite.service';

/**
 * Action: Send Invite
 * Requires: ORG Context + MEMBER_INVITE Permission
 */
export const sendInviteAction = orgActionClient
  .metadata({
    name: 'invite.send',
    permissions: [AppPermission.MEMBER_INVITE],
  })
  .schema(SendInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await inviteService.sendInvite(ctx.orgId, ctx.userId, parsedInput);
  });

/**
 * Action: Accept Invite
 * Requires: Auth Context (User logged in)
 */
export const acceptInviteAction = authActionClient
  .metadata({ name: 'invite.accept' })
  .schema(AcceptInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await inviteService.acceptInvite(ctx.userId, parsedInput.token);
  });
