import { userRepository } from '@/core/auth/repositories/user.repository';
import { eventBus } from '@/core/events/event-bus.service';
import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { UserRoleInOrg } from '@/lib/action-policies';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';

class MemberService extends AbstractService {
  /**
   * Fetch all members of an organization.
   */
  async getMembers(orgId: string) {
    return this.handleOperation('member.list', async () => {
      // We use the generic 'list' method from FirestoreRepository
      const { data } = await userRepository.list({
        where: [{ field: 'orgId', op: '==', value: orgId }],
        orderBy: [{ field: 'displayName', direction: 'asc' }],
        limit: 100, // Pagination can be added later
      });
      return data;
    });
  }

  /**
   * Updates a member's role.
   * Strict Rule: Admins/Owners cannot demote themselves blindly (requires safeguards).
   */
  async updateMemberRole(
    adminId: string,
    orgId: string,
    targetUserId: string,
    newRole: UserRoleInOrg,
  ): Promise<Result<void>> {
    return this.handleOperation('member.updateRole', async () => {
      if (adminId === targetUserId) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'You cannot change your own role.');
      }

      const targetUser = await userRepository.get(targetUserId);
      if (targetUser.orgId !== orgId) {
        throw new CustomError(AppErrorCode.NOT_FOUND, 'User is not in this organization.');
      }

      await userRepository.update(targetUserId, { orgRole: newRole });

      // Audit Log (Future)
    });
  }

  /**
   * Removes a member from the organization.
   */
  async removeMember(adminId: string, orgId: string, targetUserId: string): Promise<Result<void>> {
    return this.handleOperation('member.remove', async () => {
      if (adminId === targetUserId) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'You cannot remove yourself.');
      }

      const targetUser = await userRepository.get(targetUserId);
      if (targetUser.orgId !== orgId) {
        throw new CustomError(AppErrorCode.NOT_FOUND, 'User is not in this organization.');
      }

      // Soft Delete logic: We just strip their Org context
      await userRepository.update(targetUserId, {
        orgId: undefined,
        orgRole: UserRoleInOrg.NOT_IN_ORG,
        isOnboarded: false,
      });

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
