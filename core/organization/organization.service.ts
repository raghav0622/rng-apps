import { AbstractService } from '@/core/abstract-service/AbstractService';
import { AuditAction } from '@/core/audit/audit.model';
import { auditRepository } from '@/core/audit/audit.repository';
import { userRepository } from '@/core/auth/user.repository';
import { SubscriptionPlan } from '@/core/billing/billing.model';
import { subscriptionRepository } from '@/core/billing/subscription.repository';
import { eventBus } from '@/core/events/event-bus.service';
import { NotificationTopic } from '@/core/notifications/notification.model';
import { notificationService } from '@/core/notifications/notification.service';
import { UserRoleInOrg } from '@/core/action-policies';
import { firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/core/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { billingService } from '../billing/billing.service';
import {
    CreateOrgInput,
    Invite,
    InviteStatus,
    InviteWithOrg,
    MemberWithProfile,
    Organization,
    SendInviteSchema,
    UpdateOrgInput
} from './organization.model';
import { inviteRepository, organizationRepository } from './organization.repository';

type SendInviteInput = z.infer<typeof SendInviteSchema>;

// Billing Limits Configuration
const SEAT_LIMITS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 5,
  [SubscriptionPlan.PRO]: 10,
  [SubscriptionPlan.ENTERPRISE]: 50,
};

class OrganizationService extends AbstractService {
  // ===========================================================================
  // 🛡️ Helper: Billing Check
  // ===========================================================================

  /**
   * Checks if the organization has reached its seat limit.
   * Throws an error if the limit is exceeded.
   */
  private async checkSeatLimits(orgId: string, additionalSeats = 1): Promise<void> {
    const subscription = await subscriptionRepository.getByOrgId(orgId);
    const plan = subscription?.planId || SubscriptionPlan.FREE;
    const limit = SEAT_LIMITS[plan];

    // Count Active Members
    const members = await organizationRepository.members(orgId).list({ limit: 1000 });
    const activeMembersCount = members.data.length;

    // Count Pending Invites (They reserve a seat)
    const invites = await inviteRepository.list({
      where: [
        { field: 'orgId', op: '==', value: orgId },
        { field: 'status', op: '==', value: InviteStatus.PENDING },
      ],
    });
    const pendingInvitesCount = invites.data.length;

    if (activeMembersCount + pendingInvitesCount + additionalSeats > limit) {
      throw new CustomError(
        AppErrorCode.QUOTA_EXCEEDED,
        `Organization seat limit reached (${limit}). Please upgrade your plan.`,
      );
    }
  }

  // ===========================================================================
  // 🏢 Organization Lifecycle
  // ===========================================================================

  async createOrganization(userId: string, input: CreateOrgInput): Promise<Result<Organization>> {
    return this.handleOperation('org.create', async () => {
      const orgId = uuidv4();
      let newOrg: Organization;

      await firestore().runTransaction(async (t) => {
        const userRepoT = userRepository.withTransaction(t);
        const orgRepoT = organizationRepository.withTransaction(t);
        const memberRepoT = organizationRepository.members(orgId).withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        const user = await userRepoT.get(userId);
        if (user.orgId) {
          throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'User is already in an organization.');
        }

        newOrg = await orgRepoT.create(orgId, {
          name: input.name,
          ownerId: userId,
        });

        await memberRepoT.create(userId, {
          orgId,
          userId,
          role: UserRoleInOrg.OWNER,
          joinedAt: new Date(),
          status: 'ACTIVE',
        });

        await userRepoT.update(userId, {
          orgId: orgId,
          orgRole: UserRoleInOrg.OWNER,
          isOnboarded: true,
        });

        await billingService.initializeFreeTier(orgId, t);

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId: userId,
          action: AuditAction.RESOURCE_CREATE,
          targetId: orgId,
          metadata: { name: input.name, plan: SubscriptionPlan.FREE },
        });
      });

      await userRepository.clearCache(userId);
      await eventBus.publish('org.created', newOrg!, { orgId, actorId: userId });
      return newOrg!;
    });
  }

  async updateOrganization(orgId: string, input: UpdateOrgInput): Promise<Result<void>> {
    return this.handleOperation('org.update', async () => {
      await firestore().runTransaction(async (t) => {
        const orgRepoT = organizationRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await orgRepoT.update(orgId, input);

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId: 'system',
          action: AuditAction.ORG_UPDATE,
          targetId: orgId,
          metadata: input,
        });
      });
    });
  }

  // ===========================================================================
  // 🤝 Safe Ownership Transfer
  // ===========================================================================

  async offerOwnership(
    actorId: string,
    orgId: string,
    targetUserId: string,
  ): Promise<Result<void>> {
    return this.handleOperation('org.offerOwnership', async () => {
      if (actorId === targetUserId) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'You already own this organization.');
      }

      const member = await organizationRepository.members(orgId).get(targetUserId);
      if (!member) {
        throw new CustomError(AppErrorCode.NOT_FOUND, 'Target user is not a member of this org.');
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await firestore().runTransaction(async (t) => {
        const orgRepoT = organizationRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await orgRepoT.update(orgId, {
          pendingOwnerId: targetUserId,
          transferExpiresAt: expiresAt,
        });

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId,
          action: AuditAction.ORG_UPDATE,
          targetId: targetUserId,
          metadata: { type: 'ownership_offer', expiresAt },
        });
      });

      await notificationService.send(targetUserId, {
        topic: NotificationTopic.SECURITY,
        title: 'Ownership Offer Received',
        message: 'You have been offered ownership of the organization.',
        link: '/settings',
        orgId,
      });
    });
  }

  async revokeOwnershipOffer(actorId: string, orgId: string): Promise<Result<void>> {
    return this.handleOperation('org.revokeOwnershipOffer', async () => {
      const org = await organizationRepository.get(orgId);
      if (!org.pendingOwnerId) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'No pending ownership transfer found.');
      }

      const targetId = org.pendingOwnerId;

      await firestore().runTransaction(async (t) => {
        const orgRepoT = organizationRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await orgRepoT.update(orgId, {
          pendingOwnerId: null,
          transferExpiresAt: null,
        });

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId,
          action: AuditAction.ORG_UPDATE,
          targetId: targetId,
          metadata: { type: 'ownership_revoke' },
        });
      });
    });
  }

  async rejectOwnershipOffer(actorId: string, orgId: string): Promise<Result<void>> {
    return this.handleOperation('org.rejectOwnershipOffer', async () => {
      const org = await organizationRepository.get(orgId);

      if (org.pendingOwnerId !== actorId) {
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'You do not have a pending ownership offer.');
      }

      await firestore().runTransaction(async (t) => {
        const orgRepoT = organizationRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await orgRepoT.update(orgId, {
          pendingOwnerId: null,
          transferExpiresAt: null,
        });

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId,
          action: AuditAction.ORG_UPDATE,
          targetId: org.ownerId, // Notify the owner
          metadata: { type: 'ownership_reject' },
        });
      });

      // Notify the owner
      await notificationService.send(org.ownerId, {
        topic: NotificationTopic.SECURITY,
        title: 'Ownership Offer Rejected',
        message: 'The ownership transfer offer was rejected.',
        orgId,
      });
    });
  }

  async acceptOwnership(actorId: string, orgId: string): Promise<Result<void>> {
    return this.handleOperation('org.acceptOwnership', async () => {
      const org = await organizationRepository.get(orgId);

      if (org.pendingOwnerId !== actorId) {
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'You do not have a pending ownership offer.');
      }

      if (org.transferExpiresAt && new Date() > org.transferExpiresAt) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Ownership offer has expired.');
      }

      const oldOwnerId = org.ownerId;

      await firestore().runTransaction(async (t) => {
        const orgRepoT = organizationRepository.withTransaction(t);
        const memberRepoT = organizationRepository.members(orgId).withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await orgRepoT.update(orgId, {
          ownerId: actorId,
          pendingOwnerId: null,
          transferExpiresAt: null,
        });

        await memberRepoT.update(oldOwnerId, { role: UserRoleInOrg.ADMIN });
        await userRepoT.update(oldOwnerId, { orgRole: UserRoleInOrg.ADMIN });

        await memberRepoT.update(actorId, { role: UserRoleInOrg.OWNER });
        await userRepoT.update(actorId, { orgRole: UserRoleInOrg.OWNER });

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId,
          action: AuditAction.ORG_UPDATE,
          targetId: actorId,
          metadata: { type: 'ownership_transfer', from: oldOwnerId, to: actorId },
        });
      });

      await userRepository.clearCache(oldOwnerId);
      await userRepository.clearCache(actorId);

      await notificationService.send(oldOwnerId, {
        topic: NotificationTopic.SECURITY,
        title: 'Ownership Transferred',
        message: 'You have successfully transferred ownership and are now an Admin.',
        orgId,
      });
    });
  }

  // ===========================================================================
  // 👥 Members (RBAC & Management)
  // ===========================================================================

  async getMembers(orgId: string): Promise<Result<MemberWithProfile[]>> {
    return this.handleOperation('org.getMembers', async () => {
      const { data } = await organizationRepository.members(orgId).list({
        orderBy: [{ field: 'role', direction: 'asc' }],
        limit: 100,
      });

      const membersWithProfiles = await Promise.all(
        data.map(async (member) => {
          try {
            const user = await userRepository.get(member.userId);
            return {
              ...member,
              user: {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              },
            } as MemberWithProfile;
          } catch (e) {
            return member as MemberWithProfile;
          }
        }),
      );

      return membersWithProfiles;
    });
  }

  async updateMemberRole(
    actorId: string,
    orgId: string,
    targetUserId: string,
    newRole: UserRoleInOrg,
  ): Promise<Result<void>> {
    return this.handleOperation('org.updateMember', async () => {
      if (actorId === targetUserId) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Cannot change your own role.');
      }

      const memberRepo = organizationRepository.members(orgId);
      const actorMember = await memberRepo.get(actorId);
      const targetMember = await memberRepo.get(targetUserId);

      if (!actorMember) throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Actor is not a member of the organization.');
      if (!targetMember) throw new CustomError(AppErrorCode.NOT_FOUND, 'Target user is not a member of the organization.');

      if (actorMember.role === UserRoleInOrg.ADMIN) {
        if (targetMember.role === UserRoleInOrg.OWNER || targetMember.role === UserRoleInOrg.ADMIN) {
          throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Admins cannot modify Owners or other Admins.');
        }
      }

      if (newRole !== UserRoleInOrg.OWNER && targetMember.role === UserRoleInOrg.OWNER) {
        const { data: owners } = await memberRepo.list({
          where: [{ field: 'role', op: '==', value: UserRoleInOrg.OWNER }],
        });
        if (owners.length <= 1) {
          throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Cannot remove the last owner.');
        }
      }

      await firestore().runTransaction(async (t) => {
        const memberRepoT = memberRepo.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await memberRepoT.update(targetUserId, { role: newRole });
        await userRepoT.update(targetUserId, { orgRole: newRole });

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId,
          action: AuditAction.MEMBER_UPDATE_ROLE,
          targetId: targetUserId,
          metadata: { oldRole: targetMember.role, newRole },
        });
      });

      await userRepository.clearCache(targetUserId);

      await notificationService.send(targetUserId, {
        topic: NotificationTopic.TEAM,
        title: 'Role Updated',
        message: `Your role has been updated to ${newRole}.`,
        orgId,
      });
    });
  }

  async removeMember(actorId: string, orgId: string, targetUserId: string): Promise<Result<void>> {
    return this.handleOperation('org.removeMember', async () => {
      if (actorId === targetUserId)
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Cannot remove yourself.');

      const memberRepo = organizationRepository.members(orgId);
      const actorMember = await memberRepo.get(actorId);
      const targetMember = await memberRepo.get(targetUserId);

      if (!actorMember) throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Actor is not a member of the organization.');
      if (!targetMember) throw new CustomError(AppErrorCode.NOT_FOUND, 'Target user is not a member of the organization.');

      if (actorMember.role === UserRoleInOrg.ADMIN) {
        if (targetMember.role === UserRoleInOrg.OWNER || targetMember.role === UserRoleInOrg.ADMIN) {
          throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Admins cannot remove Owners or other Admins.');
        }
      }

      if (targetMember.role === UserRoleInOrg.OWNER) {
        const { data: owners } = await memberRepo.list({
          where: [{ field: 'role', op: '==', value: UserRoleInOrg.OWNER }],
        });
        if (owners.length <= 1) {
          throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Cannot remove the last owner.');
        }
      }

      await firestore().runTransaction(async (t) => {
        const memberRepoT = memberRepo.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await memberRepoT.forceDelete(targetUserId);
        await userRepoT.update(targetUserId, {
          orgId: undefined,
          orgRole: UserRoleInOrg.NOT_IN_ORG,
          isOnboarded: false,
        });

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId,
          action: AuditAction.MEMBER_REMOVE,
          targetId: targetUserId,
          metadata: { userId: targetUserId },
        });
      });

      await userRepository.clearCache(targetUserId);
      await eventBus.publish('member.removed', { userId: targetUserId, orgId }, { orgId, actorId });
    });
  }

  // ===========================================================================
  // 📩 Invites
  // ===========================================================================

  async listPendingInvites(orgId: string): Promise<Result<Invite[]>> {
    return this.handleOperation('org.listInvites', async () => {
      const { data } = await inviteRepository.list({
        where: [
          { field: 'orgId', op: '==', value: orgId },
          { field: 'status', op: '==', value: InviteStatus.PENDING },
        ],
        limit: 50,
      });
      return data;
    });
  }

  async getUserPendingInvites(email: string): Promise<Result<InviteWithOrg[]>> {
    return this.handleOperation('org.getUserInvites', async () => {
      const invites = await inviteRepository.findByEmail(email);

      const invitesWithOrgs = await Promise.all(
        invites.map(async (invite) => {
          try {
            const org = await organizationRepository.get(invite.orgId);
            return {
              ...invite,
              organizationName: org.name,
            } as InviteWithOrg;
          } catch (e) {
            return invite as InviteWithOrg;
          }
        }),
      );

      return invitesWithOrgs;
    });
  }

  async sendInvite(
    orgId: string,
    inviterId: string,
    input: SendInviteInput,
  ): Promise<Result<Invite>> {
    return this.handleOperation('org.sendInvite', async () => {
      if (await inviteRepository.existsActiveInvite(orgId, input.email)) {
        throw new CustomError(AppErrorCode.ALREADY_EXISTS, 'Invite already exists.');
      }

      const existingUser = await userRepository.getByEmail(input.email);
      if (existingUser && existingUser.orgId) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'User is already in an organization.');
      }

      await this.checkSeatLimits(orgId);

      return await firestore()
        .runTransaction(async (t) => {
          const inviteRepoT = inviteRepository.withTransaction(t);
          const auditRepoT = auditRepository.withTransaction(t);

          const token = uuidv4();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
          const inviteId = uuidv4();

          const invite = await inviteRepoT.create(inviteId, {
            orgId,
            inviterId,
            email: input.email,
            role: input.role,
            token,
            status: InviteStatus.PENDING,
            expiresAt,
          });

          await auditRepoT.create(uuidv4(), {
            orgId,
            actorId: inviterId,
            action: AuditAction.MEMBER_INVITE,
            targetId: inviteId,
            metadata: { email: input.email, role: input.role },
          });

          return invite;
        })
        .then(async (invite) => {
          await eventBus.publish('invite.created', { ...invite }, { orgId, actorId: inviterId });
          return invite;
        });
    });
  }

  async acceptInvite(userId: string, token: string): Promise<Result<void>> {
    return this.handleOperation('org.acceptInvite', async () => {
      const invite = await inviteRepository.findByToken(token);
      if (!invite) throw new CustomError(AppErrorCode.NOT_FOUND, 'Invalid invite.');

      const user = await userRepository.get(userId);
      if (user.email !== invite.email)
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Email mismatch.');
      if (user.orgId) {
        if (user.orgId === invite.orgId) return;
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Already in an org.');
      }

      await this.checkSeatLimits(invite.orgId);

      await firestore().runTransaction(async (t) => {
        const inviteRepoT = inviteRepository.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);
        const memberRepoT = organizationRepository.members(invite.orgId).withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await inviteRepoT.update(invite.id, { status: InviteStatus.ACCEPTED });

        await memberRepoT.create(userId, {
          orgId: invite.orgId,
          userId: userId,
          role: invite.role,
          joinedAt: new Date(),
          status: 'ACTIVE',
        });

        await userRepoT.update(userId, {
          orgId: invite.orgId,
          orgRole: invite.role,
          isOnboarded: true,
        });

        await auditRepoT.create(uuidv4(), {
          orgId: invite.orgId,
          actorId: userId,
          action: AuditAction.INVITE_ACCEPT,
          targetId: invite.id,
          metadata: { email: user.email, source: 'invite' },
        });
      });

      await userRepository.clearCache(userId);
      await eventBus.publish(
        'member.added',
        { userId, orgId: invite.orgId },
        { orgId: invite.orgId, actorId: userId },
      );

      await notificationService.send(invite.inviterId, {
        topic: NotificationTopic.TEAM,
        title: 'Invite Accepted',
        message: `${user.email} has joined the organization.`,
        orgId: invite.orgId,
      });
    });
  }

  async rejectInvite(userId: string, token: string): Promise<Result<void>> {
    return this.handleOperation('org.rejectInvite', async () => {
      const invite = await inviteRepository.findByToken(token);
      if (!invite) throw new CustomError(AppErrorCode.NOT_FOUND, 'Invalid invite.');

      const user = await userRepository.get(userId);
      if (user.email !== invite.email)
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Email mismatch.');

      await firestore().runTransaction(async (t) => {
         const inviteRepoT = inviteRepository.withTransaction(t);
         const auditRepoT = auditRepository.withTransaction(t);

         await inviteRepoT.update(invite.id, { status: InviteStatus.REJECTED });
         
         await auditRepoT.create(uuidv4(), {
           orgId: invite.orgId,
           actorId: userId,
           action: AuditAction.INVITE_REJECT,
           targetId: invite.id,
           metadata: { email: user.email },
         });
      });
    });
  }

  async revokeInvite(orgId: string, inviteId: string, actorId: string): Promise<Result<void>> {
    return this.handleOperation('org.revokeInvite', async () => {
      const invite = await inviteRepository.get(inviteId);
      if (invite.orgId !== orgId)
        throw new CustomError(AppErrorCode.NOT_FOUND, 'Invite not found.');

      await firestore().runTransaction(async (t) => {
        const inviteRepoT = inviteRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await inviteRepoT.update(inviteId, { status: InviteStatus.REVOKED });

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId,
          action: AuditAction.INVITE_REVOKE,
          targetId: inviteId,
          metadata: { email: invite.email },
        });
      });
    });
  }
}

export const organizationService = new OrganizationService();
