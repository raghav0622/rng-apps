import { firestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import 'server-only';
import { CreateEventInput, DomainEvent, EventStatus } from './event.model';

export class EventRepository {
  private collection = firestore().collection('events');

  /**
   * Creates an event. Can be part of an existing transaction.
   */
  create(
    data: CreateEventInput,
    transaction?: FirebaseFirestore.Transaction,
  ): DomainEvent | Promise<DomainEvent> {
    const docRef = this.collection.doc();
    const now = Timestamp.now();

    const event: DomainEvent = {
      id: docRef.id,
      ...data,
      status: EventStatus.PENDING,
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      lastAttemptAt: null,
      error: null,
    };

    if (transaction) {
      transaction.set(docRef, event);
      return event;
    } else {
      return docRef.set(event).then(() => event);
    }
  }

  /**
   * Fetch pending events for the background worker.
   */
  async findPending(limit = 10): Promise<DomainEvent[]> {
    const snapshot = await this.collection
      .where('status', '==', EventStatus.PENDING)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as DomainEvent);
  }

  /**
   * Mark event as completed or failed.
   */
  async updateStatus(
    eventId: string,
    status: EventStatus,
    updates: Partial<Pick<DomainEvent, 'error' | 'lastAttemptAt' | 'attempts'>>,
  ): Promise<void> {
    await this.collection.doc(eventId).update({
      status,
      updatedAt: Timestamp.now(),
      ...updates,
    });
  }
}

export const eventRepository = new EventRepository();
