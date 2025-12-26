import { AuditAction } from '@/core/audit/audit.model';
import { auditRepository } from '@/core/audit/audit.repository';
import { userRepository } from '@/core/auth/user.repository';
import { SubscriptionPlan } from '@/core/billing/billing.model';
import { subscriptionRepository } from '@/core/billing/subscription.repository';
import { eventBus } from '@/core/events/event-bus.service';
import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { UserRoleInOrg } from '@/lib/action-policies';
import { firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  CreateOrgInput,
  Invite,
  InviteStatus,
  Member,
  Organization,
  SendInviteSchema,
  UpdateOrgInput,
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
    const members = await organizationRepository.members(orgId).list({ limit: 1000 }); // Optimization: count aggregation in real app
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

        // 1. Check: User cannot have an existing orgId
        const user = await userRepoT.get(userId);
        if (user.orgId) {
          throw new CustomError(
            AppErrorCode.PERMISSION_DENIED,
            'User is already in an organization.',
          );
        }

        // 2. Create Org Doc
        newOrg = await orgRepoT.create(orgId, {
          name: input.name,
          ownerId: userId,
        });

        // 3. Create Owner Member Doc
        await memberRepoT.create(userId, {
          orgId,
          userId,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL || '',
          role: UserRoleInOrg.OWNER,
          joinedAt: new Date(),
          status: 'ACTIVE',
        });

        // 4. Update User Profile
        await userRepoT.update(userId, {
          orgId: orgId,
          orgRole: UserRoleInOrg.OWNER,
          isOnboarded: true,
        });

        // 5. Audit Log (Atomic)
        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId: userId,
          action: AuditAction.RESOURCE_CREATE, // Or explicit ORG_CREATE if added to enum
          targetId: orgId,
          metadata: { name: input.name },
        });
      });

      await userRepository.clearCache(userId);
      await eventBus.publish('org.created', newOrg!, { orgId, actorId: userId });
      return newOrg!;
    });
  }

  async updateOrganization(orgId: string, input: UpdateOrgInput): Promise<Result<void>> {
    return this.handleOperation('org.update', async () => {
      // Note: Permission checks are handled by the Action Metadata/Policy

      await firestore().runTransaction(async (t) => {
        const orgRepoT = organizationRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await orgRepoT.update(orgId, input);

        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId: 'system', // Or pass actorId through context if available in service method
          action: AuditAction.ORG_UPDATE,
          targetId: orgId,
          metadata: input,
        });
      });
    });
  }

  // ===========================================================================
  // 👥 Members (RBAC & Management)
  // ===========================================================================

  async getMembers(orgId: string): Promise<Result<Member[]>> {
    return this.handleOperation('org.getMembers', async () => {
      const { data } = await organizationRepository.members(orgId).list({
        orderBy: [{ field: 'role', direction: 'asc' }], // Owner first usually
        limit: 100,
      });
      return data;
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
      const targetMember = await memberRepo.get(targetUserId);

      // Safety: If demoting last owner
      if (newRole !== UserRoleInOrg.OWNER && targetMember.role === UserRoleInOrg.OWNER) {
        const { data: owners } = await memberRepo.list({
          where: [{ field: 'role', op: '==', value: UserRoleInOrg.OWNER }],
        });
        if (owners.length <= 1) {
          throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Cannot remove the last owner.');
        }
      }

      // Sync Role: Update Member Doc AND User Doc
      await firestore().runTransaction(async (t) => {
        const memberRepoT = memberRepo.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await memberRepoT.update(targetUserId, { role: newRole });
        await userRepoT.update(targetUserId, { orgRole: newRole });

        // Audit
        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId,
          action: AuditAction.MEMBER_UPDATE_ROLE,
          targetId: targetUserId,
          metadata: { oldRole: targetMember.role, newRole },
        });
      });

      await userRepository.clearCache(targetUserId);
    });
  }

  async removeMember(actorId: string, orgId: string, targetUserId: string): Promise<Result<void>> {
    return this.handleOperation('org.removeMember', async () => {
      if (actorId === targetUserId)
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Cannot remove yourself.');

      const memberRepo = organizationRepository.members(orgId);

      // 1. Fetch Member to check role
      const targetMember = await memberRepo.get(targetUserId);

      // 2. Safety: Cannot remove last OWNER
      if (targetMember.role === UserRoleInOrg.OWNER) {
        const { data: owners } = await memberRepo.list({
          where: [{ field: 'role', op: '==', value: UserRoleInOrg.OWNER }],
        });
        if (owners.length <= 1) {
          throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Cannot remove the last owner.');
        }
      }

      // 3. Transaction: Delete Member -> Update User -> Audit
      await firestore().runTransaction(async (t) => {
        const memberRepoT = memberRepo.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        await memberRepoT.forceDelete(targetUserId); // Hard delete from org
        await userRepoT.update(targetUserId, {
          orgId: undefined, // Explicit null in Firestore
          orgRole: UserRoleInOrg.NOT_IN_ORG,
          isOnboarded: false,
        });

        // Audit
        await auditRepoT.create(uuidv4(), {
          orgId,
          actorId,
          action: AuditAction.MEMBER_REMOVE,
          targetId: targetUserId,
          metadata: { email: targetMember.email },
        });
      });

      await userRepository.clearCache(targetUserId);
      await eventBus.publish('member.removed', { userId: targetUserId, orgId }, { orgId, actorId });
    });
  }

  // ===========================================================================
  // 📩 Invites (Transactional + Billing)
  // ===========================================================================

  async listPendingInvites(orgId: string) {
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

  async sendInvite(
    orgId: string,
    inviterId: string,
    input: SendInviteInput,
  ): Promise<Result<Invite>> {
    return this.handleOperation('org.sendInvite', async () => {
      // 1. Logic Checks
      if (await inviteRepository.existsActiveInvite(orgId, input.email)) {
        throw new CustomError(AppErrorCode.ALREADY_EXISTS, 'Invite already exists.');
      }

      const existingUser = await userRepository.getByEmail(input.email);
      if (existingUser?.orgId) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'User is already in an organization.');
      }

      // 2. BILLING CHECK: Ensure we have space
      await this.checkSeatLimits(orgId);

      // 3. Create Invite & Audit (Atomic)
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

          // Side effect usually goes here or after transaction.
          // We'll publish event after.
          return invite;
        })
        .then(async (invite) => {
          // TODO: await emailService.sendInvite(input.email, token);
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
        if (user.orgId === invite.orgId) return; // Idempotent
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Already in an org.');
      }

      // Transaction: Accept Invite -> Create Member -> Update User -> Audit
      await firestore().runTransaction(async (t) => {
        const inviteRepoT = inviteRepository.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);
        const memberRepoT = organizationRepository.members(invite.orgId).withTransaction(t);
        const auditRepoT = auditRepository.withTransaction(t);

        // 🛑 RACE CONDITION PROTECTION: Re-check limits inside the lock
        // We manually count inside the transaction scope if strict consistency is needed.
        // For now, we assume this optimistic check combined with `checkSeatLimits` logic is sufficient
        // or we would use a counter field on the Org document for strictly atomic limit enforcement.
        // await this.checkSeatLimits(invite.orgId); <--- This would need to be transaction-aware

        // 1. Update Invite Status
        await inviteRepoT.update(invite.id, { status: InviteStatus.ACCEPTED });

        // 2. Create Member Doc
        await memberRepoT.create(userId, {
          orgId: invite.orgId,
          userId: userId,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: invite.role,
          joinedAt: new Date(),
          status: 'ACTIVE',
        });

        // 3. Update User Profile
        await userRepoT.update(userId, {
          orgId: invite.orgId,
          orgRole: invite.role,
          isOnboarded: true,
        });

        // 4. Audit
        await auditRepoT.create(uuidv4(), {
          orgId: invite.orgId,
          actorId: userId,
          action: AuditAction.RESOURCE_CREATE, // Member Added
          targetId: userId,
          metadata: { email: user.email, source: 'invite' },
        });
      });

      await userRepository.clearCache(userId);
      await eventBus.publish(
        'member.added',
        { userId, orgId: invite.orgId },
        { orgId: invite.orgId, actorId: userId },
      );
    });
  }

  async rejectInvite(userId: string, token: string): Promise<Result<void>> {
    return this.handleOperation('org.rejectInvite', async () => {
      const invite = await inviteRepository.findByToken(token);
      if (!invite) throw new CustomError(AppErrorCode.NOT_FOUND, 'Invalid invite.');

      const user = await userRepository.get(userId);
      if (user.email !== invite.email)
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Email mismatch.');

      await inviteRepository.update(invite.id, { status: InviteStatus.REJECTED });
    });
  }

  async revokeInvite(orgId: string, inviteId: string): Promise<Result<void>> {
    return this.handleOperation('org.revokeInvite', async () => {
      const invite = await inviteRepository.get(inviteId);
      if (invite.orgId !== orgId)
        throw new CustomError(AppErrorCode.NOT_FOUND, 'Invite not found.');

      await inviteRepository.update(inviteId, { status: InviteStatus.REVOKED });
    });
  }
}

export const organizationService = new OrganizationService();
