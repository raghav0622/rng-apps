import { userRepository } from '@/features/auth/repositories/user.repository';
import { UserRoleInOrg } from '@/features/enums';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { firestore } from '@/lib/firebase/admin';
import { serializeFirestoreData } from '@/lib/firebase/utils';
import { Result } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import 'server-only';
import { OrgInvite } from '../invite.model';
import { inviteRepository } from '../repositories/invite.repository';
import { orgRepository } from '../repositories/org.repository';

export class InviteService {
  /**
   * Creates an invitation for a user to join an organization.
   */
  static async createInvite(
    actorId: string,
    orgId: string,
    email: string,
    role: UserRoleInOrg,
  ): Promise<Result<OrgInvite>> {
    // 1. Validation
    const org = await orgRepository.getById(orgId);
    if (!org) throw new CustomError(AppErrorCode.NOT_FOUND, 'Organization not found');

    // 2. Check for existing pending invite
    const existing = await inviteRepository.findPendingInvite(orgId, email);
    if (existing) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'User already has a pending invite.');
    }

    // 3. Check if user is ALREADY in the org (Optional but good UX)
    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser && existingUser.orgId === orgId) {
      throw new CustomError(
        AppErrorCode.INVALID_INPUT,
        'User is already a member of this organization.',
      );
    }

    // 4. Create Invite
    const now = Timestamp.now();
    const newInvite: OrgInvite = {
      id: firestore().collection('invites').doc().id,
      email,
      orgId,
      orgName: org.name,
      role,
      invitedBy: actorId,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await inviteRepository.create(newInvite);
    return { success: true, data: newInvite };
  }

  /**
   * Retrieves pending invites for the current user.
   */
  static async getMyInvites(email: string): Promise<Result<OrgInvite[]>> {
    const invites = await inviteRepository.getPendingByEmail(email);
    return { success: true, data: serializeFirestoreData(invites) };
  }

  /**
   * Accepts or Rejects an invite.
   * ENFORCES: Single Tenancy on Accept.
   */
  static async respondToInvite(
    userId: string,
    email: string,
    inviteId: string,
    accept: boolean,
  ): Promise<Result<void>> {
    const invite = await inviteRepository.getById(inviteId);
    if (!invite) throw new CustomError(AppErrorCode.NOT_FOUND, 'Invite not found');

    if (invite.email !== email) {
      throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'This invite does not belong to you.');
    }

    if (invite.status !== 'PENDING') {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invite has already been processed.');
    }

    // REJECTION FLOW
    if (!accept) {
      await inviteRepository.updateStatus(inviteId, 'REJECTED');
      return { success: true, data: undefined };
    }

    // ACCEPTANCE FLOW
    // 1. Check strict Single Tenancy
    const user = await userRepository.getUser(userId);
    if (user.orgId) {
      throw new CustomError(
        AppErrorCode.PERMISSION_DENIED,
        'You are already in an organization. You must leave it before joining another.',
      );
    }

    // 2. Transaction: Update User & Close Invite
    await firestore().runTransaction(async (t) => {
      // Re-read invite inside transaction to prevent race conditions
      const freshInviteDoc = await t.get(firestore().collection('invites').doc(inviteId));
      const freshInvite = freshInviteDoc.data() as OrgInvite;

      if (freshInvite.status !== 'PENDING') {
        throw new CustomError(
          AppErrorCode.INVALID_INPUT,
          'Invite was just processed by another request.',
        );
      }

      // Update User
      t.update(firestore().collection('users').doc(userId), {
        orgId: invite.orgId,
        orgRole: invite.role,
        updatedAt: Timestamp.now(),
        onboarded: true,
      });

      // Update Invite
      t.update(firestore().collection('invites').doc(inviteId), {
        status: 'ACCEPTED',
        respondedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    return { success: true, data: undefined };
  }
}
