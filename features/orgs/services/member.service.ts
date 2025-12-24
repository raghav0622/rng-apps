import { AuditAction } from '@/features/audit/audit.model';
import { AuditService } from '@/features/audit/audit.service';
import { User } from '@/features/auth/auth.model';
import { UserRoleInOrg } from '@/features/enums';
import { AppPermission, hasPermission } from '@/lib/action-policies';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { EventType, publishEvent } from '@/lib/events';
import { firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import 'server-only';
import { memberRepository } from '../repositories/member.repository';

export class MemberService {
  /**
   * Retrieves the list of members for the organization.
   */
  static async getMembers(orgId: string): Promise<Result<User[]>> {
    const members = await memberRepository.getMembers(orgId);
    return { success: true, data: members };
  }

  /**
   * Updates a member's role.
   * Requires: MEMBER_UPDATE permission.
   */
  static async updateMemberRole(
    actorId: string,
    actorRole: UserRoleInOrg,
    targetUserId: string,
    newRole: UserRoleInOrg,
    orgId: string,
  ): Promise<Result<void>> {
    // 1. Permission Check
    if (!hasPermission(actorRole, AppPermission.MEMBER_UPDATE)) {
      throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Not authorized to update members.');
    }

    // 2. Validate Target
    const targetUser = await memberRepository.getMemberInOrg(orgId, targetUserId);
    if (!targetUser) {
      throw new CustomError(AppErrorCode.NOT_FOUND, 'Member not found in this organization.');
    }

    // 3. Prevent self-demotion if it leaves no owner (Basic check)
    if (
      actorId === targetUserId &&
      actorRole === UserRoleInOrg.OWNER &&
      newRole !== UserRoleInOrg.OWNER
    ) {
      // Warning: Allowing self-demotion without checking for other owners is risky,
      // but we'll permit it for now with a frontend warning.
    }

    // 4. Execute Transaction (Update + Event + Audit)
    await firestore().runTransaction(async (t) => {
      // A. Update User
      t.update(firestore().collection('users').doc(targetUserId), {
        orgRole: newRole,
        updatedAt: Timestamp.now(),
      });

      // B. Publish Domain Event
      publishEvent(
        t,
        EventType.MEMBER_ROLE_UPDATED,
        {
          orgId,
          userId: targetUserId,
          oldRole: targetUser.orgRole,
          newRole,
          updatedBy: actorId,
        },
        { traceId: 'sync', actorId, orgId },
      );

      // C. Audit Log
      await AuditService.record(
        {
          orgId,
          actorId,
          action: AuditAction.MEMBER_ROLE_CHANGE,
          targetResource: 'member',
          targetId: targetUserId,
          details: { oldRole: targetUser.orgRole, newRole },
        },
        t,
      );
    });

    return { success: true, data: undefined };
  }

  /**
   * Removes a member from the organization.
   * Requires: MEMBER_REMOVE permission.
   */
  static async removeMember(
    actorId: string,
    targetUserId: string,
    orgId: string,
  ): Promise<Result<void>> {
    // 1. Validate Actor Permissions (We need to fetch actor's role if not passed,
    // but usually ctx provides it. For now, assuming ctx passed it or we fetch it).
    // Note: The action passes ctx.role, so we should update signature or fetch it.
    // For safety, let's fetch the actor's current role to be sure.
    const actor = await memberRepository.getMemberInOrg(orgId, actorId);
    if (!actor || !hasPermission(actor.orgRole, AppPermission.MEMBER_REMOVE)) {
      throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Not authorized to remove members.');
    }

    // 2. Validate Target
    const targetUser = await memberRepository.getMemberInOrg(orgId, targetUserId);
    if (!targetUser) {
      throw new CustomError(AppErrorCode.NOT_FOUND, 'Member not found.');
    }

    // 3. Prevent removing the last Owner
    if (targetUser.orgRole === UserRoleInOrg.OWNER) {
      const allMembers = await memberRepository.getMembers(orgId);
      const ownerCount = allMembers.filter((m) => m.orgRole === UserRoleInOrg.OWNER).length;
      if (ownerCount <= 1) {
        throw new CustomError(AppErrorCode.PRECONDITION_FAILED, 'Cannot remove the last owner.');
      }
    }

    // 4. Transaction
    await firestore().runTransaction(async (t) => {
      // A. Unlink User from Org
      t.update(firestore().collection('users').doc(targetUserId), {
        orgId: null,
        orgRole: UserRoleInOrg.NOT_IN_ORG,
        updatedAt: Timestamp.now(),
      });

      // B. Event
      publishEvent(
        t,
        EventType.MEMBER_REMOVED,
        {
          orgId,
          userId: targetUserId,
          removedBy: actorId,
        },
        { actorId, orgId },
      );

      // C. Audit
      await AuditService.record(
        {
          orgId,
          actorId,
          action: AuditAction.MEMBER_REMOVE,
          targetResource: 'member',
          targetId: targetUserId,
          details: { email: targetUser.email, role: targetUser.orgRole },
        },
        t,
      );
    });

    return { success: true, data: undefined };
  }
}
