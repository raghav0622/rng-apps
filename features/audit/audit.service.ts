import { AuditAction, AuditLog } from '@/features/audit/audit.model';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { Timestamp, Transaction } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import 'server-only';
import { auditRepository } from './audit.repository';

interface RecordAuditInput {
  orgId: string;
  actorId: string;
  actorEmail?: string;
  action: AuditAction;
  targetResource: string;
  targetId?: string;
  details?: Record<string, unknown>;
  traceId?: string;
}

export class AuditService {
  /**
   * Records an action for compliance and history.
   * Can be awaited or fired-and-forgotten depending on critical level.
   */
  static async record(input: RecordAuditInput, t?: Transaction): Promise<Result<void>> {
    try {
      const headersList = await headers();
      const ip = headersList.get('x-forwarded-for') || 'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      const log: AuditLog = {
        id: firestore().collection('audit_logs').doc().id,
        ...input,
        details: input.details || {},
        ip,
        userAgent,
        createdAt: Timestamp.now(),
      };

      await auditRepository.create(log, t);
      return { success: true, data: undefined };
    } catch (error) {
      // Audit failure should ideally not block the main action unless strict compliance mode
      // For now, we log to console so observability catches it
      console.error('FAILED_TO_AUDIT', error);
      return {
        success: false,
        error: new CustomError(AppErrorCode.UNKNOWN, 'Audit log failed').toAppError(),
      };
    }
  }
}
