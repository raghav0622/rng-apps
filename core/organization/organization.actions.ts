'use server';

import { auditRepository } from '@/core/audit/audit.repository';
import { billingService } from '@/core/billing/billing.service';
import {
  AcceptInviteSchema,
  AcceptOwnershipSchema,
  CreateOrgSchema,
  OfferOwnershipSchema,
  RejectInviteSchema,
  RemoveMemberSchema,
  RevokeInviteSchema,
  SendInviteSchema,
  UpdateMemberRoleSchema,
  UpdateOrgSchema,
} from '@/core/organization/organization.model';
import { organizationService } from '@/core/organization/organization.service';
import { authActionClient, orgActionClient } from '@/core/safe-action/safe-action';
import { AppPermission } from '@/lib/action-policies';
import { revalidatePath } from 'next/cache';

// --- Org Actions ---

export const createOrganizationAction = authActionClient
  .metadata({ name: 'org.create' })
  .schema(CreateOrgSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await organizationService.createOrganization(ctx.userId, parsedInput);
    if (result.success) {
      // No revalidate needed here as we usually redirect after creation
    }
    return result;
  });

export const updateOrganizationAction = orgActionClient
  .metadata({ name: 'org.update', permissions: [AppPermission.ORG_UPDATE] })
  .schema(UpdateOrgSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await organizationService.updateOrganization(ctx.orgId, parsedInput);
    revalidatePath('/dashboard/settings');
    return result;
  });

// --- Ownership Transfer Actions ---

export const offerOwnershipAction = orgActionClient
  .metadata({ name: 'org.offerOwnership', permissions: [AppPermission.ORG_TRANSFER_OWNERSHIP] })
  .schema(OfferOwnershipSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await organizationService.offerOwnership(
      ctx.userId,
      ctx.orgId,
      parsedInput.targetUserId,
    );
    revalidatePath('/dashboard/settings');
    return result;
  });

export const acceptOwnershipAction = orgActionClient
  .metadata({ name: 'org.acceptOwnership', permissions: [AppPermission.ORG_UPDATE] }) // Assuming admin level perms needed to initiate accept? Or member? Technically only the *future* owner needs to accept.
  .schema(AcceptOwnershipSchema)
  .action(async ({ ctx }) => {
    const result = await organizationService.acceptOwnership(ctx.userId, ctx.orgId);
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/team');
    return result;
  });

// --- Billing Actions (Convenience) ---

export const getSubscriptionAction = orgActionClient
  .metadata({ name: 'billing.get' })
  .action(async ({ ctx }) => {
    return await billingService.getSubscription(ctx.orgId);
  });

// --- Member Actions ---

export const getMembersAction = orgActionClient
  .metadata({ name: 'org.getMembers', permissions: [AppPermission.MEMBER_READ] })
  .action(async ({ ctx }) => {
    return await organizationService.getMembers(ctx.orgId);
  });

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
    const res = await organizationService.sendInvite(ctx.orgId, ctx.userId, parsedInput);
    revalidatePath('/dashboard/team');
    return res;
  });

export const revokeInviteAction = orgActionClient
  .metadata({ name: 'org.revokeInvite', permissions: [AppPermission.MEMBER_INVITE] })
  .schema(RevokeInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    const res = await organizationService.revokeInvite(ctx.orgId, parsedInput.inviteId);
    revalidatePath('/dashboard/team');
    return res;
  });

export const acceptInviteAction = authActionClient
  .metadata({ name: 'org.acceptInvite' })
  .schema(AcceptInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    const res = await organizationService.acceptInvite(ctx.userId, parsedInput.token);
    // Client should handle redirect
    return res;
  });

export const rejectInviteAction = authActionClient
  .metadata({ name: 'org.rejectInvite' })
  .schema(RejectInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await organizationService.rejectInvite(ctx.userId, parsedInput.token);
  });

// --- Audit Actions ---

export const getAuditLogsAction = orgActionClient
  .metadata({ name: 'org.auditLogs', permissions: [AppPermission.ORG_UPDATE] })
  .action(async ({ ctx }) => {
    const logs = await auditRepository.getOrgLogs(ctx.orgId);
    return { success: true, data: logs }; // Wrap manually since repository doesn't return Result
  });
