import { firestore } from '@/lib/firebase/admin';
import { BaseEntity } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import 'server-only';
import { Organization } from './org.model';

export class OrgRepository {
  private collection = firestore().collection('organizations');

  async findById(orgId: string): Promise<Organization | null> {
    const snap = await this.collection.doc(orgId).get();
    if (!snap.exists) return null;
    return snap.data() as Organization;
  }

  /**
   * Creates an Organization within a transaction.
   */
  create(
    transaction: FirebaseFirestore.Transaction,
    orgId: string,
    data: Omit<Organization, keyof BaseEntity | 'id'>,
  ): void {
    const now = Timestamp.now();
    const orgRef = this.collection.doc(orgId);

    const org: Organization = {
      id: orgId,
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    transaction.set(orgRef, org);
  }

  /**
   * Updates an Organization.
   */
  async update(orgId: string, data: Partial<Organization>): Promise<void> {
    await this.collection.doc(orgId).update({
      ...data,
      updatedAt: Timestamp.now(),
    });
  }
}

export const orgRepository = new OrgRepository();
