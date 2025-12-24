import { EventType } from '@/lib/events';
import { firestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import 'server-only';
import { inviteCreatedHandler } from './handlers/invite.handler';
import { JobHandler } from './types';

// Registry of handlers
const HANDLERS: Record<string, JobHandler> = {
  [EventType.INVITE_CREATED]: inviteCreatedHandler,
};

export class JobProcessor {
  /**
   * Processes a batch of pending events.
   * Can be called via a Cron Job (Vercel Cron) or an API endpoint.
   */
  static async processPendingEvents(limit = 10) {
    const eventsRef = firestore().collection('events');

    // 1. Fetch Pending Events
    const snapshot = await eventsRef
      .where('status', '==', 'PENDING')
      .orderBy('occurredAt', 'asc')
      .limit(limit)
      .get();

    if (snapshot.empty) return { processed: 0 };

    const results = [];

    // 2. Process Each
    for (const doc of snapshot.docs) {
      const event = doc.data();
      const handler = HANDLERS[event.type];

      if (!handler) {
        // No handler defined, mark as skipped or failed?
        // We'll mark COMPLETED to stop retry loops for now.
        await doc.ref.update({ status: 'SKIPPED', processedAt: Timestamp.now() });
        continue;
      }

      try {
        // Mark PROCESSING (optional, for long running jobs)
        await doc.ref.update({ status: 'PROCESSING' });

        // Execute Logic
        await handler.handle(event as any);

        // Mark COMPLETED
        await doc.ref.update({ status: 'COMPLETED', processedAt: Timestamp.now() });
        results.push({ id: doc.id, status: 'COMPLETED' });
      } catch (error: any) {
        console.error(`Job Failed [${event.type}]:`, error);
        await doc.ref.update({
          status: 'FAILED',
          processingErrors: [error.message || 'Unknown error'],
          processedAt: Timestamp.now(),
        });
        results.push({ id: doc.id, status: 'FAILED' });
      }
    }

    return { processed: results.length, results };
  }
}
