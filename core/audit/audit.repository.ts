import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { AuditLog, AuditLogSchema } from './audit.model';

const COLLECTION_PATH = 'audit_logs';

class AuditRepository extends AbstractFirestoreRepository<AuditLog> {
  constructor() {
    super(COLLECTION_PATH, {
      schema: AuditLogSchema,
      softDeleteEnabled: false, // Audit logs are immutable/permanent
    });
  }

  async getOrgLogs(orgId: string, limit = 50): Promise<AuditLog[]> {
    const { data } = await this.list({
      where: [{ field: 'orgId', op: '==', value: orgId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit,
    });
    return data;
  }
}

export const auditRepository = new AuditRepository();
