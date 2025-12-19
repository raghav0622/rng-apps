import { AppErrorCode, CustomError } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { Result } from '@/lib/types';
import 'server-only';
import { CreateEventInput } from './event.model';
import { eventRepository } from './event.repository';

export class EventService {
  /**
   * Publishes a domain event.
   * NOTE: For critical consistency, prefer calling eventRepository.create()
   * directly inside your feature's Firestore transaction.
   */
  static async publish(input: CreateEventInput): Promise<Result<string>> {
    try {
      const event = await eventRepository.create(input);
      logInfo(`Event Published: ${input.type}`, { eventId: event.id, traceId: input.traceId });
      return { success: true, data: event.id };
    } catch (error) {
      logError('Failed to publish event', { error, input });
      return {
        success: false,
        error: new CustomError(AppErrorCode.DB_ERROR, 'Failed to publish event'),
      };
    }
  }
}
