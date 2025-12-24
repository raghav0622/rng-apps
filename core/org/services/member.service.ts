import { userRepository } from '@/core/auth/repositories/user.repository';
import { eventBus } from '@/core/events/event-bus.service';
import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { UserRoleInOrg } from '@/lib/action-policies';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';

class MemberService extends AbstractService {
  /**
   * Updates a member's role within the organization.
   */
  async updateMemberRole(
    adminId: string,
    orgId: string,
    targetUserId: string,
    newRole: UserRoleInOrg,
  ): Promise<Result<void>> {
    return this.handleOperation('member.updateRole', async () => {
      // 1. Validation
      if (adminId === targetUserId) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'You cannot change your own role.');
      }

      const targetUser = await userRepository.get(targetUserId);
      if (targetUser.orgId !== orgId) {
        throw new CustomError(AppErrorCode.NOT_FOUND, 'User is not in this organization.');
      }

      // 2. Update
      await userRepository.update(targetUserId, { orgRole: newRole });

      // 3. Audit/Event
      // await eventBus.publish('member.role_updated', { ... });
    });
  }

  /**
   * Removes a member from the organization.
   */
  async removeMember(adminId: string, orgId: string, targetUserId: string): Promise<Result<void>> {
    return this.handleOperation('member.remove', async () => {
      if (adminId === targetUserId) {
        throw new CustomError(
          AppErrorCode.INVALID_INPUT,
          'You cannot remove yourself. Leave the org instead.',
        );
      }

      const targetUser = await userRepository.get(targetUserId);
      if (targetUser.orgId !== orgId) {
        throw new CustomError(AppErrorCode.NOT_FOUND, 'User is not in this organization.');
      }

      // 2. Remove (Set to NOT_IN_ORG)
      await userRepository.update(targetUserId, {
        orgId: null,
        orgRole: UserRoleInOrg.NOT_IN_ORG,
      });

      // 3. Event
      await eventBus.publish(
        'member.removed',
        {
          userId: targetUserId,
          removedBy: adminId,
          orgId,
        },
        { orgId, actorId: adminId },
      );
    });
  }
}

export const memberService = new MemberService();
