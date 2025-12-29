import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

/**
 * Task workflow states
 * Flow: TODO → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → CHANGES_REQUESTED/APPROVED
 */
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED', // User has submitted work for review
  UNDER_REVIEW = 'UNDER_REVIEW', // Admin/Owner is reviewing
  CHANGES_REQUESTED = 'CHANGES_REQUESTED', // Admin requested changes
  APPROVED = 'APPROVED', // Admin approved the task
  DONE = 'DONE', // Task is complete and closed
}

export enum TaskResourceType {
  GENERAL = 'GENERAL',
  PROJECT = 'PROJECT',
  RESEARCH = 'RESEARCH',
  INVOICE = 'INVOICE',
  DRAWING = 'DRAWING',
}

/**
 * File attachment schema for tasks
 * Supports images, documents, and other file types
 */
export const TaskAttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(), // Size in bytes
  fileType: z.string(), // MIME type
  fileUrl: z.string(), // Firebase Storage URL
  uploadedBy: z.string(), // User ID
  uploadedAt: z.date().or(z.any()),
  isImage: z.boolean().default(false),
  thumbnailUrl: z.string().optional(), // For image previews
});

export type TaskAttachment = z.infer<typeof TaskAttachmentSchema>;

/**
 * Comment/feedback schema for task collaboration
 * Tracks the conversation between admin and assigned user
 */
export const TaskCommentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(), // Who wrote the comment
  userName: z.string(), // Display name for UI
  userRole: z.enum(['ADMIN', 'OWNER', 'STAFF']), // User's role
  content: z.string().min(1),
  commentType: z.enum(['FEEDBACK', 'RESPONSE', 'NOTE', 'APPROVAL', 'REJECTION']),
  attachments: z.array(TaskAttachmentSchema).default([]),
  createdAt: z.date().or(z.any()),
  updatedAt: z.date().or(z.any()),
});

export type TaskComment = z.infer<typeof TaskCommentSchema>;

/**
 * Submission record for tracking work submissions
 */
export const TaskSubmissionSchema = z.object({
  id: z.string(),
  submittedBy: z.string(),
  submittedAt: z.date().or(z.any()),
  notes: z.string().optional(),
  attachments: z.array(TaskAttachmentSchema).default([]),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().or(z.any()).optional(),
  reviewNotes: z.string().optional(),
});

export type TaskSubmission = z.infer<typeof TaskSubmissionSchema>;

export const TimeLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date().or(z.any()), // Handle Firestore Timestamps
  durationMinutes: z.number().min(15),
  description: z.string(),
});

export type TimeLog = z.infer<typeof TimeLogSchema>;

/**
 * Enhanced Task schema with collaborative workflow support
 * Includes comments, attachments, and submission tracking
 */
export const TaskSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),

  // Assignment
  assignedTo: z.string().nullable(),
  assignedBy: z.string().optional(), // Admin who assigned the task
  assignedAt: z.date().or(z.any()).optional(),
  reviewerId: z.string().nullable(),

  // Resource linking (ADMIN/OWNER only)
  resourceType: z.nativeEnum(TaskResourceType).default(TaskResourceType.GENERAL),
  resourceId: z.string().optional(),

  // Economics (ADMIN/OWNER only)
  estimatedMinutes: z.number().default(0),
  billableRate: z.number().min(0).default(0), // Revenue generated per hour
  costRate: z.number().min(0).default(0), // Internal staff cost per hour

  // Time tracking
  timeLogs: z.array(TimeLogSchema).default([]),

  // Initial assignment attachments (reference files from admin)
  initialAttachments: z.array(TaskAttachmentSchema).default([]),

  // Comments and feedback thread
  comments: z.array(TaskCommentSchema).default([]),

  // Submission history (tracks all submissions and reviews)
  submissions: z.array(TaskSubmissionSchema).default([]),

  // Current submission details (for quick access)
  currentSubmission: TaskSubmissionSchema.optional(),

  // Legacy fields (kept for backward compatibility)
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

/**
 * Input type for creating/updating tasks
 * Excludes auto-generated fields like comments and submissions
 */
export type TaskInput = Omit<
  Task,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'comments'
  | 'submissions'
  | 'currentSubmission'
>;
