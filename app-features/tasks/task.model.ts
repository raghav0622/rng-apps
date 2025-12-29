import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW', // <-- The Gate
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  DONE = 'DONE',
}

export enum TaskResourceType {
  GENERAL = 'GENERAL',
  PROJECT = 'PROJECT',
  RESEARCH = 'RESEARCH',
  INVOICE = 'INVOICE',
  DRAWING = 'DRAWING',
}

// Time Logging for Actuals
export const TimeLogSchema = z.object({
  id: z.string(),
  userId: z.string(), // Who did the work
  date: z.date(),
  durationMinutes: z.number().min(15),
  description: z.string(),
});

export const TaskSchema = z.object({
  id: z.string(),
  orgId: z.string(),

  // Core Info
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.date().optional(),

  // Assignments (Member IDs)
  assignedTo: z.string().nullable(), // The Doer
  reviewerId: z.string().nullable(), // The Approver (Admin/Manager)

  // Polymorphic Link (Stored Flat in DB)
  resourceType: z.nativeEnum(TaskResourceType).default(TaskResourceType.GENERAL),
  resourceId: z.string().optional(),

  // Economics & Profitability
  estimatedMinutes: z.number().default(0), // Planned effort
  billableRate: z.number().min(0).default(0), // Revenue per hour
  costRate: z.number().min(0).default(0), // Cost per hour (Staff salary equivalent)

  // Actuals
  timeLogs: z.array(TimeLogSchema).default([]),

  // Review Workflow
  submissionNotes: z.string().optional(), // "I finished the render, check attached."
  reviewFeedback: z.string().optional(), // "Shadows are wrong, fix it."

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Task = z.infer<typeof TaskSchema> & BaseEntity;

// --- Strict Polymorphism for Application Layer ---
// This allows the UI to handle different task contexts safely.

export type TaskContext =
  | { type: TaskResourceType.GENERAL; id: undefined }
  | { type: TaskResourceType.PROJECT; id: string; projectData?: any }
  | { type: TaskResourceType.RESEARCH; id: string; researchData?: any }
  | { type: TaskResourceType.INVOICE; id: string; invoiceData?: any };

// Derived Type for Profitability Analysis
export interface TaskEconomics {
  taskId: string;
  totalActualMinutes: number;
  totalCost: number; // totalActualMinutes/60 * costRate
  totalRevenue: number; // totalActualMinutes/60 * billableRate
  profitMargin: number; // (Revenue - Cost) / Revenue
}
