// core/lib/notifications/AbstractNotificationProvider.ts
import { AbstractService } from '../abstract-service/AbstractService';
import { Result } from '../../lib/types';

export interface NotificationPayload {
  to: string;
  templateId: string;
  data: Record<string, any>;
  orgId: string;
}

/**
 * Base provider for sending notifications (Email, SMS, Push).
 * Extends AbstractService to gain Circuit Breaking and Idempotency features.
 */
export abstract class AbstractNotificationProvider extends AbstractService {
  protected abstract sendInternal(payload: NotificationPayload): Promise<void>;

  /**
   * Sends a notification safely.
   * Wraps the provider execution in a circuit breaker and checks idempotency.
   *
   * @param {NotificationPayload} payload - details of the notification.
   * @param {string} [idempotencyKey] - Optional key to prevent double-sends (e.g. "welcome-email-user-123").
   * @returns {Promise<Result<void>>}
   *
   * @example
   * await mailer.send({ to: 'user@example.com', templateId: 'welcome', data: {} });
   */
  async send(payload: NotificationPayload, idempotencyKey?: string): Promise<Result<void>> {
    return this.handleOperation(
      `NOTIFY_${this.constructor.name}`,
      () => this.sendInternal(payload),
      { idempotencyKey },
    );
  }
}
