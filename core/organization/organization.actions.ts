'use server';

import { authActionClient, orgActionClient } from '@/core/safe-action/safe-action';
import { AppPermission } from '@/lib/action-policies';
import { revalidatePath } from 'next/cache';
import {
  AcceptInviteSchema,
  CreateOrgSchema,
  RejectInviteSchema,
  RemoveMemberSchema,
  RevokeInviteSchema,
  SendInviteSchema,
  UpdateMemberRoleSchema,
  UpdateOrgSchema,
} from './organization.model';
import { organizationService } from './organization.service';

// --- Org Actions ---

export const createOrganizationAction = authActionClient
  .metadata({ name: 'org.create' })
  .schema(CreateOrgSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await organizationService.createOrganization(ctx.userId, parsedInput);
  });

export const updateOrganizationAction = orgActionClient
  .metadata({ name: 'org.update', permissions: [AppPermission.ORG_UPDATE] })
  .schema(UpdateOrgSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await organizationService.updateOrganization(ctx.orgId, parsedInput);
  });

// --- Member Actions ---

export const updateMemberRoleAction = orgActionClient
  .metadata({ name: 'org.updateMember', permissions: [AppPermission.MEMBER_UPDATE] })
  .schema(UpdateMemberRoleSchema)
  .action(async ({ ctx, parsedInput }) => {
    const res = await organizationService.updateMemberRole(
      ctx.userId,
      ctx.orgId,
      parsedInput.userId,
      parsedInput.role,
    );
    revalidatePath('/dashboard/team');
    return res;
  });

export const removeMemberAction = orgActionClient
  .metadata({ name: 'org.removeMember', permissions: [AppPermission.MEMBER_DELETE] })
  .schema(RemoveMemberSchema)
  .action(async ({ ctx, parsedInput }) => {
    const res = await organizationService.removeMember(ctx.userId, ctx.orgId, parsedInput.userId);
    revalidatePath('/dashboard/team');
    return res;
  });

// --- Invite Actions ---

export const sendInviteAction = orgActionClient
  .metadata({ name: 'org.sendInvite', permissions: [AppPermission.MEMBER_INVITE] })
  .schema(SendInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await organizationService.sendInvite(ctx.orgId, ctx.userId, parsedInput);
  });

export const acceptInviteAction = authActionClient
  .metadata({ name: 'org.acceptInvite' })
  .schema(AcceptInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await organizationService.acceptInvite(ctx.userId, parsedInput.token);
  });

export const rejectInviteAction = authActionClient
  .metadata({ name: 'org.rejectInvite' })
  .schema(RejectInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await organizationService.rejectInvite(ctx.userId, parsedInput.token);
  });

export const revokeInviteAction = orgActionClient
  .metadata({ name: 'org.revokeInvite', permissions: [AppPermission.MEMBER_INVITE] })
  .schema(RevokeInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    const res = await organizationService.revokeInvite(ctx.orgId, parsedInput.inviteId);
    revalidatePath('/dashboard/team');
    return res;
  });
