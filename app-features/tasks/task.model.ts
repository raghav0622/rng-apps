import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW', // Staff can only reach this gate
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  DONE = 'DONE', // Only Admin/Reviewer can set to DONE
}

export enum TaskResourceType {
  GENERAL = 'GENERAL',
  PROJECT = 'PROJECT',
  RESEARCH = 'RESEARCH',
  INVOICE = 'INVOICE',
  DRAWING = 'DRAWING',
}

export const TimeLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date().or(z.any()), // Handle Firestore Timestamps
  durationMinutes: z.number().min(15),
  description: z.string(),
});

export const TaskSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),

  assignedTo: z.string().nullable(),
  reviewerId: z.string().nullable(),

  resourceType: z.nativeEnum(TaskResourceType).default(TaskResourceType.GENERAL),
  resourceId: z.string().optional(),

  estimatedMinutes: z.number().default(0),
  billableRate: z.number().min(0).default(0), // Revenue generated per hour
  costRate: z.number().min(0).default(0), // Internal staff cost per hour

  timeLogs: z.array(TimeLogSchema).default([]),

  submissionNotes: z.string().optional(),
  reviewFeedback: z.string().optional(),

  createdAt: z.date().or(z.any()),
  updatedAt: z.date().or(z.any()),
  deletedAt: z.date().nullable().optional(),
});

export type Task = z.infer<typeof TaskSchema> & BaseEntity;

export interface TaskEconomics {
  totalActualMinutes: number;
  totalCost: number; // (minutes/60) * costRate
  totalRevenue: number; // (minutes/60) * billableRate
  profitability: number; // Revenue - Cost
}
