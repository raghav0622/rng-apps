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
  Organization,
  SendInviteSchema,
  UpdateOrgInput,
} from './organization.model';
import { inviteRepository, organizationRepository } from './organization.repository';

type SendInviteInput = z.infer<typeof SendInviteSchema>;

class OrganizationService extends AbstractService {
  // --- Organization Lifecycle ---

  async createOrganization(userId: string, input: CreateOrgInput): Promise<Result<Organization>> {
    return this.handleOperation('org.create', async () => {
      let newOrg: Organization;

      await firestore().runTransaction(async (t) => {
        const userRepoT = userRepository.withTransaction(t);
        const orgRepoT = organizationRepository.withTransaction(t);

        const user = await userRepoT.get(userId);
        if (user.orgId) {
          throw new CustomError(
            AppErrorCode.PERMISSION_DENIED,
            'User is already in an organization.',
          );
        }

        const orgId = uuidv4();
        newOrg = await orgRepoT.create(orgId, {
          name: input.name,
          ownerId: userId,
        });

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
      await organizationRepository.update(orgId, input);
    });
  }

  // --- Member Management ---

  async getMembers(orgId: string) {
    return this.handleOperation('org.getMembers', async () => {
      const { data } = await userRepository.list({
        where: [{ field: 'orgId', op: '==', value: orgId }],
        orderBy: [{ field: 'displayName', direction: 'asc' }],
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

      const targetUser = await userRepository.get(targetUserId);
      if (targetUser.orgId !== orgId)
        throw new CustomError(AppErrorCode.NOT_FOUND, 'Member not found.');

      // Safety: If demoting last owner
      if (newRole !== UserRoleInOrg.OWNER && targetUser.orgRole === UserRoleInOrg.OWNER) {
        const owners = await userRepository.list({
          where: [
            { field: 'orgId', op: '==', value: orgId },
            { field: 'orgRole', op: '==', value: 'OWNER' },
          ],
        });
        if (owners.data.length <= 1) {
          throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Cannot remove the last owner.');
        }
      }

      await userRepository.update(targetUserId, { orgRole: newRole });
    });
  }

  async removeMember(actorId: string, orgId: string, targetUserId: string): Promise<Result<void>> {
    return this.handleOperation('org.removeMember', async () => {
      if (actorId === targetUserId)
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Cannot remove yourself.');

      const targetUser = await userRepository.get(targetUserId);
      if (targetUser.orgId !== orgId)
        throw new CustomError(AppErrorCode.NOT_FOUND, 'Member not found.');

      if (targetUser.orgRole === UserRoleInOrg.OWNER) {
        const owners = await userRepository.list({
          where: [
            { field: 'orgId', op: '==', value: orgId },
            { field: 'orgRole', op: '==', value: 'OWNER' },
          ],
        });
        if (owners.data.length <= 1) {
          throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Cannot remove the last owner.');
        }
      }

      await userRepository.update(targetUserId, {
        orgId: undefined,
        orgRole: UserRoleInOrg.NOT_IN_ORG,
        isOnboarded: false,
      });

      await eventBus.publish('member.removed', { userId: targetUserId, orgId }, { orgId, actorId });
    });
  }

  // --- Invites ---

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
      if (await inviteRepository.existsActiveInvite(orgId, input.email)) {
        throw new CustomError(AppErrorCode.ALREADY_EXISTS, 'Invite already exists.');
      }

      const existingUser = await userRepository.getByEmail(input.email);
      if (existingUser?.orgId) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'User is already in an organization.');
      }

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

      await firestore().runTransaction(async (t) => {
        const inviteRepoT = inviteRepository.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);

        await inviteRepoT.update(invite.id, { status: InviteStatus.ACCEPTED });
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

  /**
   * Rejects a pending invite.
   * Performed by the Invitee (must be logged in and match email).
   */
  async rejectInvite(userId: string, token: string): Promise<Result<void>> {
    return this.handleOperation('org.rejectInvite', async () => {
      // 1. Validate Invite
      const invite = await inviteRepository.findByToken(token);
      if (!invite) {
        throw new CustomError(AppErrorCode.NOT_FOUND, 'Invalid or expired invite link.');
      }

      // 2. Validate User ownership
      const user = await userRepository.get(userId);
      if (user.email !== invite.email) {
        throw new CustomError(
          AppErrorCode.PERMISSION_DENIED,
          'This invite was sent to a different email address.',
        );
      }

      // 3. Reject
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
