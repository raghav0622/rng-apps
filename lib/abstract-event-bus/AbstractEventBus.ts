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

export abstract class AbstractEventBus {
  protected abstract deliver(event: AppEvent): Promise<void>;

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
