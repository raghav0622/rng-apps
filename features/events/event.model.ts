import { BaseEntity, OrgScoped } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface DomainEvent extends BaseEntity, OrgScoped {
  type: string;
  payload: Record<string, any>;
  status: EventStatus;
  traceId: string;
  actorId?: string;
  attempts: number;
  lastAttemptAt?: Timestamp | null;
  error?: string | null;
}

export const CreateEventSchema = z.object({
  type: z.string(),
  // FIX: Explicitly define key type as string for Zod v4 compatibility
  payload: z.record(z.string(), z.any()),
  orgId: z.string(),
  actorId: z.string().optional(),
  traceId: z.string(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
