import { logError } from '@/lib/logger';
import { Result } from '@/lib/types';
import 'server-only';
import { CreateAuditLogInput } from './audit.model';
import { auditRepository } from './audit.repository';

export class AuditService {
  /**
   * Logs a user action. Swallows errors to prevent blocking the main flow,
   * but logs the failure to the system logger.
   */
  static async log(input: CreateAuditLogInput): Promise<Result<void>> {
    try {
      await auditRepository.create(input);
      return { success: true, data: undefined };
    } catch (error) {
      // We explicitly do NOT throw here to avoid failing the user's request
      // just because the audit log failed. However, we log it effectively.
      logError('Audit Log Failed', { error, input });
      // In a strict banking app, we might throw here. For SaaS, we usually prefer availability.
      return { success: true, data: undefined };
    }
  }
}
