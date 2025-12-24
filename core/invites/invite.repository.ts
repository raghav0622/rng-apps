import { FirestoreRepository } from '@/lib/firestore-repository/firestore-repository';
import { Invite, InviteSchema } from './invite.model';

const COLLECTION_PATH = 'invites';

class InviteRepository extends FirestoreRepository<Invite> {
  constructor() {
    super(COLLECTION_PATH, {
      schema: InviteSchema,
      softDeleteEnabled: true,
    });
  }

  /**
   * Find a valid pending invite by token.
   */
  async findByToken(token: string): Promise<Invite | null> {
    const { data } = await this.list({
      where: [
        { field: 'token', op: '==', value: token },
        { field: 'status', op: '==', value: 'PENDING' },
      ],
      limit: 1,
    });

    const invite = data[0];
    if (!invite) return null;

    // Check Expiry
    if (invite.expiresAt < new Date()) {
      return null;
    }

    return invite;
  }

  /**
   * Check if an active invite already exists for this email in this org.
   */
  async existsActiveInvite(orgId: string, email: string): Promise<boolean> {
    const { data } = await this.list({
      where: [
        { field: 'orgId', op: '==', value: orgId },
        { field: 'email', op: '==', value: email },
        { field: 'status', op: '==', value: 'PENDING' },
      ],
      limit: 1,
    });
    return data.length > 0;
  }
}

export const inviteRepository = new InviteRepository();
