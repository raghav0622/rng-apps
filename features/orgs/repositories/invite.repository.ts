import { firestore } from '@/lib/firebase/admin';
import { Timestamp, Transaction } from 'firebase-admin/firestore';
import { InviteStatus, OrgInvite } from '../invite.model';

export class InviteRepository {
  private collection = firestore().collection('invites');

  async create(invite: OrgInvite): Promise<OrgInvite> {
    await this.collection.doc(invite.id).set(invite);
    return invite;
  }

  async getById(inviteId: string): Promise<OrgInvite | null> {
    const doc = await this.collection.doc(inviteId).get();
    if (!doc.exists) return null;
    return doc.data() as OrgInvite;
  }

  /**
   * Finds pending invites for a specific email.
   * Used to show the user their "Inbox" of invites.
   */
  async getPendingByEmail(email: string): Promise<OrgInvite[]> {
    const snap = await this.collection
      .where('email', '==', email)
      .where('status', '==', 'PENDING')
      .get();

    return snap.docs.map((d) => d.data() as OrgInvite);
  }

  /**
   * Checks if a pending invite already exists for this email+org
   */
  async findPendingInvite(orgId: string, email: string): Promise<OrgInvite | null> {
    const snap = await this.collection
      .where('orgId', '==', orgId)
      .where('email', '==', email)
      .where('status', '==', 'PENDING')
      .limit(1)
      .get();

    return snap.empty ? null : (snap.docs[0].data() as OrgInvite);
  }

  async updateStatus(inviteId: string, status: InviteStatus, transaction?: Transaction) {
    const updateData = {
      status,
      respondedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (transaction) {
      transaction.update(this.collection.doc(inviteId), updateData);
    } else {
      await this.collection.doc(inviteId).update(updateData);
    }
  }
}

export const inviteRepository = new InviteRepository();
