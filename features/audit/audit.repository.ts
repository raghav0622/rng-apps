import { AuditLog } from '@/features/audit/audit.model';
import { firestore } from '@/lib/firebase/admin';
import { serializeFirestoreData } from '@/lib/firebase/utils';
import { Transaction } from 'firebase-admin/firestore';
import 'server-only';

const COLLECTION = 'audit_logs';

export const auditRepository = {
  /**
   * Writes an audit log. Supports optional transaction for atomicity.
   */
  async create(log: AuditLog, t?: Transaction): Promise<void> {
    const docRef = firestore().collection(COLLECTION).doc(log.id);
    if (t) {
      t.set(docRef, log);
    } else {
      await docRef.set(log);
    }
  },

  /**
   * Fetches audit logs for an organization with pagination.
   */
  async listByOrg(orgId: string, limit = 50, lastDocId?: string): Promise<AuditLog[]> {
    let query = firestore()
      .collection(COLLECTION)
      .where('orgId', '==', orgId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (lastDocId) {
      const lastDoc = await firestore().collection(COLLECTION).doc(lastDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    // FIX: Cast d.data() to AuditLog to satisfy TypeScript
    const logs = snapshot.docs.map((d) => d.data() as AuditLog);
    return serializeFirestoreData(logs);
  },
};
