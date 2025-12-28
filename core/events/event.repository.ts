import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { SystemEvent, SystemEventSchema } from './event.model';

const COLLECTION_PATH = 'system_events';

class EventRepository extends AbstractFirestoreRepository<SystemEvent> {
  constructor() {
    super(COLLECTION_PATH, {
      schema: SystemEventSchema,
      softDeleteEnabled: false, // We hard delete processed events eventually
      enableVersioning: false,
    });
  }

  /**
   * Fetches the oldest PENDING events.
   */
  async findPendingEvents(limit = 10): Promise<SystemEvent[]> {
    const { data } = await this.list({
      where: [{ field: 'status', op: '==', value: 'PENDING' }],
      limit,
      orderBy: [{ field: 'createdAt', direction: 'asc' }],
    });
    return data;
  }
}

export const eventRepository = new EventRepository();
