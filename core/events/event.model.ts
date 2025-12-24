import { BaseEntity } from '@/lib/firestore-repository/types';
import { z } from 'zod';

export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export const SystemEventSchema = z.object({
  id: z.string(),
  topic: z.string(),
  payload: z.any(), // Flexible payload
  status: z.nativeEnum(EventStatus).default(EventStatus.PENDING),

  // Metadata
  traceId: z.string().optional(),
  actorId: z.string().optional(),
  orgId: z.string().optional(),

  // Processing Metadata
  attempts: z.number().default(0),
  lastError: z.string().optional().nullable(),
  processedAt: z.date().optional().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type SystemEvent = z.infer<typeof SystemEventSchema> & BaseEntity;
