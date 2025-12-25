import { v4 as uuidv4 } from 'uuid';
import { eventWorker } from '../events/event-worker.service';
import { AuditAction, AuditLog } from './audit.model';
import { auditRepository } from './audit.repository';

export class AuditService {
  /**
   * Records a raw log entry.
   */
  async recordLog(entry: Omit<AuditLog, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    await auditRepository.create(uuidv4(), entry);
  }

  /**
   * Initializes listeners for Domain Events -> Audit Logs
   */
  initListeners() {
    // 👈 Change eventBus.subscribe -> eventWorker.register

    // Member Removed -> Audit
    eventWorker.register('member.removed', async (payload: any, meta: any) => {
      await this.recordLog({
        orgId: meta.orgId,
        actorId: meta.actorId,
        action: AuditAction.MEMBER_REMOVE,
        targetId: payload.userId,
        metadata: { removedBy: payload.removedBy },
      });
    });

    // Invite Created -> Audit
    eventWorker.register('invite.created', async (payload: any, meta: any) => {
      await this.recordLog({
        orgId: meta.orgId,
        actorId: meta.actorId,
        action: AuditAction.MEMBER_INVITE,
        targetId: payload.inviteId,
        metadata: { email: payload.email, role: payload.role },
      });
    });
  }
}

export const auditService = new AuditService();

// Initialize listeners immediately so they are registered when the app boots
auditService.initListeners();
