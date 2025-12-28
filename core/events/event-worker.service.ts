import { AbstractService } from '@/core/abstract-service/AbstractService';
import { logError, logInfo } from '@/lib/logger';
import { EventStatus } from './event.model';
import { eventRepository } from './event.repository';

// Registry of Handlers
type EventHandler = (payload: any, metadata: any) => Promise<void>;

class EventWorkerService extends AbstractService {
  private handlers: Map<string, EventHandler> = new Map();

  constructor() {
    super();
    // Register Default Handlers (We will add more in future steps)
    this.register('test.event', async (payload) => logInfo('Test Event Processed:', payload));
  }

  /**
   * Registers a handler for a specific topic
   */
  register(topic: string, handler: EventHandler) {
    this.handlers.set(topic, handler);
  }

  /**
   * Main Worker Loop (designed for Serverless invocation)
   * Process a batch of pending events.
   */
  async processBatch(limit = 10) {
    return this.handleOperation('worker.processBatch', async () => {
      const events = await eventRepository.findPendingEvents(limit);

      if (events.length === 0) {
        return { processed: 0 };
      }

      const results = await Promise.allSettled(
        events.map((event) => this.processSingleEvent(event)),
      );

      return { processed: events.length, results };
    });
  }

  private async processSingleEvent(event: any) {
    const handler = this.handlers.get(event.topic);

    try {
      // Mark as processing
      await eventRepository.update(event.id, {
        status: EventStatus.PROCESSING,
        attempts: event.attempts + 1,
      });

      if (!handler) {
        logInfo(`[WORKER] No handler for topic: ${event.topic}`);
        // Mark completed so we don't retry endlessly
        await eventRepository.update(event.id, {
          status: EventStatus.COMPLETED,
          processedAt: new Date(),
        });
        return;
      }

      // Execute Handler
      await handler(event.payload, {
        orgId: event.orgId,
        actorId: event.actorId,
        traceId: event.traceId,
      });

      // Mark Success
      await eventRepository.update(event.id, {
        status: EventStatus.COMPLETED,
        processedAt: new Date(),
      });
    } catch (error: any) {
      logError(`[WORKER] Failed to process event ${event.id}`, { error: error.message });

      // Retry Logic (Max 3 attempts)
      const nextStatus = event.attempts + 1 >= 3 ? EventStatus.FAILED : EventStatus.PENDING;
      await eventRepository.update(event.id, {
        status: nextStatus,
        lastError: error.message,
      });
    }
  }
}

export const eventWorker = new EventWorkerService();
