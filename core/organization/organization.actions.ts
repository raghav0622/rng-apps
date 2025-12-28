'use server';

import { auditRepository } from '@/core/audit/audit.repository';
import { billingService } from '@/core/billing/billing.service';
import {
  AcceptInviteSchema,
  AcceptOwnershipSchema,
  CreateOrgSchema,
  OfferOwnershipSchema,
  RejectInviteSchema,
  RejectOwnershipSchema,
  RemoveMemberSchema,
  RevokeInviteSchema,
  RevokeOwnershipSchema,
  SendInviteSchema,
  UpdateMemberRoleSchema,
  UpdateOrgSchema,
} from '@/core/organization/organization.model';
import { organizationService } from '@/core/organization/organization.service';
import { authActionClient, orgActionClient, rateLimitMiddleware } from '@/core/safe-action/safe-action';
import { AppPermission } from '@/lib/action-policies';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { revalidatePath } from 'next/cache';
import { userRepository } from '../auth/user.repository';

// --- Org Actions ---

export const createOrganizationAction = authActionClient
  .metadata({ name: 'org.create' })
  .schema(CreateOrgSchema)
  .use(rateLimitMiddleware)
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
  .use(rateLimitMiddleware)
  .action(async ({ ctx, parsedInput }) => {
    const result = await organizationService.updateOrganization(ctx.orgId, parsedInput);
    revalidatePath('/settings');
    return result;
  });

// --- Ownership Transfer Actions ---

export const offerOwnershipAction = orgActionClient
  .metadata({ name: 'org.offerOwnership', permissions: [AppPermission.ORG_TRANSFER_OWNERSHIP] })
  .schema(OfferOwnershipSchema)
  .use(rateLimitMiddleware)
  .action(async ({ ctx, parsedInput }) => {
    const result = await organizationService.offerOwnership(
      ctx.userId,
      ctx.orgId,
      parsedInput.targetUserId,
    );
    revalidatePath('/settings');
    return result;
  });

export const revokeOwnershipAction = orgActionClient
  .metadata({ name: 'org.revokeOwnership', permissions: [AppPermission.ORG_TRANSFER_OWNERSHIP] })
  .schema(RevokeOwnershipSchema)
  .use(rateLimitMiddleware)
  .action(async ({ ctx }) => {
    const result = await organizationService.revokeOwnershipOffer(ctx.userId, ctx.orgId);
    revalidatePath('/settings');
    return result;
  });

export const rejectOwnershipAction = orgActionClient
  .metadata({ name: 'org.rejectOwnership', permissions: [AppPermission.ORG_UPDATE] })
  .schema(RejectOwnershipSchema)
  .use(rateLimitMiddleware)
  .action(async ({ ctx }) => {
    const result = await organizationService.rejectOwnershipOffer(ctx.userId, ctx.orgId);
    revalidatePath('/settings');
    return result;
  });

export const acceptOwnershipAction = orgActionClient
  .metadata({ name: 'org.acceptOwnership', permissions: [AppPermission.ORG_UPDATE] })
  .schema(AcceptOwnershipSchema)
  .use(rateLimitMiddleware)
  .action(async ({ ctx }) => {
    const result = await organizationService.acceptOwnership(ctx.userId, ctx.orgId);
    revalidatePath('/settings');
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
  .metadata({ name: 'org.getMembers', permissions: [AppPermission.MEMBER_VIEW] })
  .action(async ({ ctx }) => {
    return await organizationService.getMembers(ctx.orgId);
  });

export const updateMemberRoleAction = orgActionClient
  .metadata({ name: 'org.updateMember', permissions: [AppPermission.MEMBER_UPDATE] })
  .schema(UpdateMemberRoleSchema)
  .use(rateLimitMiddleware)
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
  .use(rateLimitMiddleware)
  .action(async ({ ctx, parsedInput }) => {
    const res = await organizationService.removeMember(ctx.userId, ctx.orgId, parsedInput.userId);
    revalidatePath('/dashboard/team');
    return res;
  });

// --- Invite Actions ---

export const listPendingInvitesAction = orgActionClient
  .metadata({ name: 'org.listInvites', permissions: [AppPermission.MEMBER_VIEW] })
  .action(async ({ ctx }) => {
    return await organizationService.listPendingInvites(ctx.orgId);
  });

/**
 * 📨 Action: Get all pending invites for the logged-in user.
 */
export const getUserPendingInvitesAction = authActionClient
  .metadata({ name: 'org.getUserPendingInvites' })
  .action(async ({ ctx }) => {
    if (!ctx.email) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'User email not found in session.');
    }
    return await organizationService.getUserPendingInvites(ctx.email);
  });

export const sendInviteAction = orgActionClient
  .metadata({ name: 'org.sendInvite', permissions: [AppPermission.MEMBER_INVITE] })
  .schema(SendInviteSchema)
  .use(rateLimitMiddleware)
  .action(async ({ ctx, parsedInput }) => {
    const res = await organizationService.sendInvite(ctx.orgId, ctx.userId, parsedInput);
    revalidatePath('/dashboard/team');
    return res;
  });

export const revokeInviteAction = orgActionClient
  .metadata({ name: 'org.revokeInvite', permissions: [AppPermission.MEMBER_INVITE] })
  .schema(RevokeInviteSchema)
  .use(rateLimitMiddleware)
  .action(async ({ ctx, parsedInput }) => {
    const res = await organizationService.revokeInvite(ctx.orgId, parsedInput.inviteId, ctx.userId);
    revalidatePath('/dashboard/team');
    return res;
  });

export const acceptInviteAction = authActionClient
  .metadata({ name: 'org.acceptInvite' })
  .schema(AcceptInviteSchema)
  .use(rateLimitMiddleware)
  .action(async ({ ctx, parsedInput }) => {
    const res = await organizationService.acceptInvite(ctx.userId, parsedInput.token);
    return res;
  });

export const rejectInviteAction = authActionClient
  .metadata({ name: 'org.rejectInvite' })
  .schema(RejectInviteSchema)
  .use(rateLimitMiddleware)
  .action(async ({ ctx, parsedInput }) => {
    return await organizationService.rejectInvite(ctx.userId, parsedInput.token);
  });

// --- Audit Actions ---

export const getAuditLogsAction = orgActionClient
  .metadata({ name: 'org.auditLogs', permissions: [AppPermission.ORG_UPDATE] })
  .action(async ({ ctx }) => {
    const logs = await auditRepository.getOrgLogs(ctx.orgId);
    
    // Join Actor & Target Data (User Profiles)
    const logsWithProfiles = await Promise.all(
      logs.map(async (log) => {
        let actorData = null;
        let targetData = null;

        // Fetch Actor
        if (log.actorId === 'system') {
          actorData = { displayName: 'System', email: 'system@rng.app' };
        } else {
          try {
            const user = await userRepository.get(log.actorId);
            actorData = {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            };
          } catch (e) {
            actorData = { displayName: 'Unknown User', email: log.actorId };
          }
        }

        // Fetch Target (If it looks like a User ID)
        // Heuristic: Actions related to members usually have targetId as userId
        const isUserTarget = log.action.includes('member') || log.action.includes('ownership');
        
        if (log.targetId && isUserTarget) {
          try {
            const user = await userRepository.get(log.targetId);
            targetData = {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            };
          } catch (e) {
            // Ignore if target is not a user or not found
          }
        }

        return {
          ...log,
          actor: actorData,
          target: targetData,
        };
      })
    );

    return { success: true, data: logsWithProfiles };
  });
