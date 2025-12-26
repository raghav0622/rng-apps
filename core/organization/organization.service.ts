import { userRepository } from '@/core/auth/user.repository';
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

class OrganizationService extends AbstractService {
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
          photoURL: user.photoURL,
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
      });

      await userRepository.clearCache(userId);
      return newOrg!;
    });
  }

  async updateOrganization(orgId: string, input: UpdateOrgInput): Promise<Result<void>> {
    return this.handleOperation('org.update', async () => {
      // Access Policy Check: Handled by Action Metadata (AppPermission.ORG_UPDATE)
      await organizationRepository.update(orgId, input);
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

        await memberRepoT.update(targetUserId, { role: newRole });
        await userRepoT.update(targetUserId, { orgRole: newRole });
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

      // 3. Transaction: Delete Member -> Update User
      await firestore().runTransaction(async (t) => {
        const memberRepoT = memberRepo.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);

        await memberRepoT.forceDelete(targetUserId); // Hard delete from org
        await userRepoT.update(targetUserId, {
          orgId: undefined, // Explicit null in Firestore
          orgRole: UserRoleInOrg.NOT_IN_ORG,
          isOnboarded: false,
        });
      });

      await userRepository.clearCache(targetUserId);
      await eventBus.publish('member.removed', { userId: targetUserId, orgId }, { orgId, actorId });
    });
  }

  // ===========================================================================
  // 📩 Invites (Transactional)
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

      // 2. Create Invite
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invite = await inviteRepository.create(uuidv4(), {
        orgId,
        inviterId,
        email: input.email,
        role: input.role,
        token,
        status: InviteStatus.PENDING,
        expiresAt,
      });

      // TODO: await emailService.sendInvite(input.email, token);
      await eventBus.publish('invite.created', { ...invite }, { orgId, actorId: inviterId });
      return invite;
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

      // Transaction: Accept Invite -> Create Member -> Update User
      await firestore().runTransaction(async (t) => {
        const inviteRepoT = inviteRepository.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);
        const memberRepoT = organizationRepository.members(invite.orgId).withTransaction(t);

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
