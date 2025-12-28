// core/lib/messaging/AbstractEventBus.ts
import { logError, logInfo } from '@/lib/logger';
import { getTraceId } from '../utils/tracing';

export interface AppEvent<P = any> {
  topic: string;
  payload: P;
  metadata: {
    traceId: string;
    actorId?: string;
    orgId?: string;
    timestamp: Date;
  };
}

/**
 * Base class for Event-Driven Architectures.
 * Decouples the act of publishing an event from the underlying transport (e.g., Redis, Kafka, Google PubSub).
 */
export abstract class AbstractEventBus {
  /**
   * Internal implementation to actually send the event to the broker.
   * @protected
   */
  protected abstract deliver(event: AppEvent): Promise<void>;

  /**
   * Publishes an event to the system.
   * Automatically enriches the event with tracing metadata (Trace ID, Timestamp).
   *
   * @template P
   * @param {string} topic - The channel or topic name (e.g., "user.created").
   * @param {P} payload - The event data.
   * @param {Object} context - Contextual data for auditing.
   * @param {string} [context.orgId] - The organization ID related to the event.
   * @param {string} [context.actorId] - The user ID who triggered the event.
   * @returns {Promise<void>}
   *
   * @example
   * await eventBus.publish('order.paid', { orderId: '123' }, { orgId: 'org-abc' });
   */
  async publish<P>(
    topic: string,
    payload: P,
    context: { orgId?: string; actorId?: string },
  ): Promise<void> {
    const event: AppEvent<P> = {
      topic,
      payload,
      metadata: {
        traceId: getTraceId(),
        timestamp: new Date(),
        ...context,
      },
    };

    try {
      await this.deliver(event);
      logInfo(`[EVENT_PUBLISHED] ${topic}`, { traceId: event.metadata.traceId });
    } catch (error) {
      logError(`[EVENT_FAILED] ${topic}`, { error, traceId: event.metadata.traceId });
      throw error;
    }
  }
}
