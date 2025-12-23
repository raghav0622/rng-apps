import { firestore } from '@/lib/firebase/admin';
import { Timestamp, Transaction } from 'firebase-admin/firestore';
import { CreateOrgInput, Organization } from '../org.model';

export class OrgRepository {
  private collection = firestore().collection('organizations');

  /**
   * Creates a new organization.
   * Supports atomic operations via optional Transaction.
   */
  async create(
    params: CreateOrgInput & { ownerId: string },
    transaction?: Transaction,
  ): Promise<Organization> {
    const docRef = this.collection.doc();
    const now = Timestamp.now();

    const newOrg: Organization = {
      id: docRef.id,
      name: params.name,
      ownerId: params.ownerId,
      plan: 'FREE',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    if (transaction) {
      transaction.set(docRef, newOrg);
    } else {
      await docRef.set(newOrg);
    }

    return newOrg;
  }

  /**
   * Retrieves an organization by ID.
   */
  async getById(orgId: string): Promise<Organization | null> {
    const doc = await this.collection.doc(orgId).get();

    if (!doc.exists) return null;

    const org = doc.data() as Organization;
    if (org.deletedAt) return null;

    return org;
  }

  /**
   * Updates organization details.
   * Supports atomic operations via optional Transaction.
   */
  async update(
    orgId: string,
    data: Partial<Organization>,
    transaction?: Transaction,
  ): Promise<void> {
    const cleanData = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) acc[key] = value;
        return acc;
      },
      {} as Record<string, any>,
    );

    const docRef = this.collection.doc(orgId);
    const updatePayload = {
      ...cleanData,
      updatedAt: Timestamp.now(),
    };

    if (transaction) {
      transaction.update(docRef, updatePayload);
    } else {
      await docRef.update(updatePayload);
    }
  }

  async softDelete(orgId: string): Promise<void> {
    await this.collection.doc(orgId).update({
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  async hardDelete(orgId: string): Promise<void> {
    await this.collection.doc(orgId).delete();
  }
}

export const orgRepository = new OrgRepository();
