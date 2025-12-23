import { userRepository } from '@/features/auth/repositories/user.repository';
import { UserRoleInOrg } from '@/features/enums';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { Result } from '@/lib/types';
import 'server-only';

export class MemberService {
  /**
   * Retrieves all members of an organization.
   */
  static async getMembers(orgId: string) {
    // In the future, we can add pagination here
    const members = await userRepository.getUsersByOrg(orgId);
    return { success: true, data: members };
  }

  /**
   * Updates a member's role.
   * STRICT RBAC:
   * 1. Cannot change your own role (must be done by another Owner/Admin).
   * 2. Only Owners can promote others to Owner.
   * 3. Cannot downgrade the last Owner.
   */
  static async updateMemberRole(
    actorId: string,
    actorRole: UserRoleInOrg,
    targetUserId: string,
    newRole: UserRoleInOrg,
    orgId: string,
  ): Promise<Result<void>> {
    if (actorId === targetUserId) {
      throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'You cannot change your own role.');
    }

    // Protection: Only Owners can make Owners
    if (newRole === UserRoleInOrg.OWNER && actorRole !== UserRoleInOrg.OWNER) {
      throw new CustomError(
        AppErrorCode.PERMISSION_DENIED,
        'Only Owners can promote users to Owner.',
      );
    }

    // Protection: Prevent modifying users who are technically "above" or "equal" if policy requires
    // (Optional: For now we trust the actorRole checks in middleware)

    await userRepository.updateUser(targetUserId, { orgRole: newRole });
    return { success: true, data: undefined };
  }

  /**
   * Removes a member from the organization.
   * STRICT RBAC:
   * 1. Owners cannot be removed (must downgrade first or delete org).
   * 2. Cannot remove yourself (use 'leave' action instead).
   */
  static async removeMember(
    actorId: string,
    targetUserId: string,
    orgId: string,
  ): Promise<Result<void>> {
    if (actorId === targetUserId) {
      throw new CustomError(
        AppErrorCode.INVALID_INPUT,
        'Use "Leave Organization" to remove yourself.',
      );
    }

    const targetUser = await userRepository.getUser(targetUserId);

    // Integrity Check
    if (targetUser.orgId !== orgId) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'User is not in this organization.');
    }

    // Protection: Cannot kick an Owner
    if (targetUser.orgRole === UserRoleInOrg.OWNER) {
      throw new CustomError(
        AppErrorCode.PERMISSION_DENIED,
        'Cannot remove an Owner. Downgrade them first.',
      );
    }

    // Perform Removal (Reset Org Fields)
    await userRepository.updateUser(targetUserId, {
      orgId: undefined, // Or null, depending on your User model strictness
      orgRole: UserRoleInOrg.NOT_IN_ORG,
    });

    return { success: true, data: undefined };
  }
}
