import { userRepository } from '@/core/auth/repositories/user.repository';
import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '../events/event-bus.service';
import { Invite, InviteStatus, SendInviteInput } from './invite.model';
import { inviteRepository } from './invite.repository';

class InviteService extends AbstractService {
  /**
   * Creates an invite and publishes the 'invite.created' event.
   */
  async sendInvite(
    orgId: string,
    inviterId: string,
    input: SendInviteInput,
  ): Promise<Result<Invite>> {
    return this.handleOperation('invite.send', async () => {
      // 1. Check for duplicates
      const exists = await inviteRepository.existsActiveInvite(orgId, input.email);
      if (exists) {
        throw new CustomError(
          AppErrorCode.ALREADY_EXISTS,
          'An active invite already exists for this email.',
        );
      }

      // 2. Create Invite Record
      const token = uuidv4(); // In real app, maybe use crypto.randomBytes
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 Days expiry

      const invite = await inviteRepository.create(uuidv4(), {
        orgId,
        inviterId,
        email: input.email,
        role: input.role,
        token,
        status: InviteStatus.PENDING,
        expiresAt,
      });

      // 3. Publish Event (Side Effect: Send Email)
      await eventBus.publish(
        'invite.created',
        {
          inviteId: invite.id,
          email: invite.email,
          orgId: invite.orgId,
          token: invite.token,
        },
        { orgId, actorId: inviterId },
      );

      return invite;
    });
  }

  /**
   * Accepts an invite.
   * STRICT: User must NOT be in an org currently.
   */
  async acceptInvite(userId: string, token: string): Promise<Result<void>> {
    return this.handleOperation('invite.accept', async () => {
      // 1. Validate Invite
      const invite = await inviteRepository.findByToken(token);
      if (!invite) {
        throw new CustomError(AppErrorCode.NOT_FOUND, 'Invalid or expired invite link.');
      }

      // 2. Validate User & Tenancy
      // We need to fetch the user to check if they match the invite email AND strict tenancy
      const user = await userRepository.get(userId);

      if (user.email !== invite.email) {
        // Security: Prevent hijacking invites
        throw new CustomError(
          AppErrorCode.PERMISSION_DENIED,
          'This invite was sent to a different email address.',
        );
      }

      if (user.orgId && user.orgId !== invite.orgId) {
        throw new CustomError(
          AppErrorCode.PERMISSION_DENIED,
          'You are already in an organization. Please leave it before accepting this invite.',
        );
      }

      if (user.orgId === invite.orgId) {
        // Idempotency: Already joined
        return;
      }

      // 3. Execute Transaction
      await firestore().runTransaction(async (t) => {
        const inviteRepoT = inviteRepository.withTransaction(t);
        const userRepoT = userRepository.withTransaction(t);

        // Mark Invite Accepted
        await inviteRepoT.update(invite.id, { status: InviteStatus.ACCEPTED });

        // Update User
        await userRepoT.update(userId, {
          orgId: invite.orgId,
          orgRole: invite.role,
          isOnboarded: true, // Auto-onboard if they accept invite
        });
      });

      // 4. Publish Event
      await eventBus.publish(
        'member.added',
        {
          userId,
          orgId: invite.orgId,
          role: invite.role,
        },
        { orgId: invite.orgId, actorId: userId },
      );
    });
  }
}

export const inviteService = new InviteService();
