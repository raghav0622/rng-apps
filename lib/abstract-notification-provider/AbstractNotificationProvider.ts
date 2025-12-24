// core/lib/notifications/AbstractNotificationProvider.ts
import { AbstractService } from '../abstract-service/AbstractService';
import { Result } from '../types';

export interface NotificationPayload {
  to: string;
  templateId: string;
  data: Record<string, any>;
  orgId: string;
}

export abstract class AbstractNotificationProvider extends AbstractService {
  protected abstract sendInternal(payload: NotificationPayload): Promise<void>;

  /**
   * Sends a notification with built-in circuit breaking and idempotency.
   */
  async send(payload: NotificationPayload, idempotencyKey?: string): Promise<Result<void>> {
    return this.handleOperation(
      `NOTIFY_${this.constructor.name}`,
      () => this.sendInternal(payload),
      { idempotencyKey },
    );
  }
}
