import { DomainEvent } from '@/lib/events';

export interface JobHandler {
  eventName: string;
  handle(event: DomainEvent): Promise<void>;
}
