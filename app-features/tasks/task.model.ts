import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  DONE = 'DONE',
}

export enum TaskResourceType {
  GENERAL = 'GENERAL',
  PROJECT = 'PROJECT',
  RESEARCH = 'RESEARCH',
  INVOICE = 'INVOICE',
}

// 🚀 IMPROVEMENT: Granular Time Logging
export const TimeLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  durationMinutes: z.number().min(15),
  description: z.string(),
  isBillable: z.boolean().default(true),
});

export const TaskSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),

  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  dueDate: z.date().optional(),

  assignedTo: z.string().nullable(),
  reviewerId: z.string().nullable(),

  resourceType: z.nativeEnum(TaskResourceType).default(TaskResourceType.GENERAL),
  resourceId: z.string().optional(),

  // 🚀 IMPROVEMENT: Profitability
  billableRate: z.number().min(0).optional(),
  costRate: z.number().min(0).optional(),
  timeLogs: z.array(TimeLogSchema).default([]),

  submissionNotes: z.string().optional(),
  reviewFeedback: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Task = z.infer<typeof TaskSchema> & BaseEntity;
export type TimeLog = z.infer<typeof TimeLogSchema>;
