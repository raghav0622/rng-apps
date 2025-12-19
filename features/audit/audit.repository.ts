import { firestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import 'server-only';
import { AuditLog, CreateAuditLogInput } from './audit.model';

export class AuditRepository {
  private collection = firestore().collection('audit_logs');

  async create(data: CreateAuditLogInput): Promise<AuditLog> {
    const docRef = this.collection.doc();
    const now = Timestamp.now();

    const logEntry: AuditLog = {
      id: docRef.id,
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    // Audit logs are generally fire-and-forget or parallel writes,
    // rarely needing strict transactional coupling with the main entity
    // unless strictly required by compliance.
    await docRef.set(logEntry);
    return logEntry;
  }

  async findByOrg(orgId: string, limit = 50): Promise<AuditLog[]> {
    const snapshot = await this.collection
      .where('orgId', '==', orgId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as AuditLog);
  }
}

export const auditRepository = new AuditRepository();
