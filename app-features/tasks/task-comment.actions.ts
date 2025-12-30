'use server';

import { orgActionClient } from '@/core/org-action-client';
import { z } from 'zod';
import { taskService } from './task.service';
import { TaskAttachmentSchema } from './task.model';

/**
 * Add a comment to a task
 * Supports feedback, responses, notes, approvals, and rejections
 */
export const addTaskCommentAction = orgActionClient
  .schema(
    z.object({
      taskId: z.string(),
      content: z.string().min(1, 'Comment cannot be empty'),
      commentType: z.enum(['FEEDBACK', 'RESPONSE', 'NOTE', 'APPROVAL', 'REJECTION']),
      attachments: z.array(TaskAttachmentSchema).default([]),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { taskId, content, commentType, attachments } = parsedInput;
    const { orgId, userId, user } = ctx;

    // Get the task to verify access
    const taskResult = await taskService.getById(orgId, taskId);
    if (!taskResult.success || !taskResult.data) {
      return { success: false, message: 'Task not found' };
    }

    const task = taskResult.data;

    // Verify user has access (assigned user, reviewer, or admin/owner)
    const canComment =
      task.assignedTo === userId ||
      task.reviewerId === userId ||
      user.orgRole === 'ADMIN' ||
      user.orgRole === 'OWNER';

    if (!canComment) {
      return { success: false, message: 'You do not have permission to comment on this task' };
    }

    // Create comment
    const comment = {
      id: crypto.randomUUID(),
      taskId,
      userId,
      userName: user.displayName || user.email || 'Unknown',
      userRole: user.orgRole,
      content,
      commentType,
      attachments,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add comment to task
    const currentComments = task.comments || [];
    const updatedComments = [...currentComments, comment];

    const updateResult = await taskService.update(orgId, taskId, {
      comments: updatedComments,
    });

    if (!updateResult.success) {
      return { success: false, message: 'Failed to add comment' };
    }

    return { success: true, data: comment, message: 'Comment added successfully' };
  });

/**
 * Submit task for review
 * User marks work as complete and adds submission notes/files
 */
export const submitTaskForReviewAction = orgActionClient
  .schema(
    z.object({
      taskId: z.string(),
      notes: z.string().optional(),
      attachments: z.array(TaskAttachmentSchema).default([]),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { taskId, notes, attachments } = parsedInput;
    const { orgId, userId, user } = ctx;

    // Get the task
    const taskResult = await taskService.getById(orgId, taskId);
    if (!taskResult.success || !taskResult.data) {
      return { success: false, message: 'Task not found' };
    }

    const task = taskResult.data;

    // Verify user is assigned to this task
    if (task.assignedTo !== userId) {
      return { success: false, message: 'Only the assigned user can submit this task' };
    }

    // Verify task is in correct state
    if (task.status !== 'IN_PROGRESS' && task.status !== 'CHANGES_REQUESTED') {
      return { success: false, message: 'Task must be in progress to submit' };
    }

    // Create submission record
    const submission = {
      id: crypto.randomUUID(),
      submittedBy: userId,
      submittedAt: new Date(),
      notes,
      attachments,
      status: 'PENDING' as const,
    };

    // Add submission to history
    const submissions = task.submissions || [];
    const updatedSubmissions = [...submissions, submission];

    // Update task status and current submission
    const updateResult = await taskService.update(orgId, taskId, {
      status: 'SUBMITTED',
      submissions: updatedSubmissions,
      currentSubmission: submission,
    });

    if (!updateResult.success) {
      return { success: false, message: 'Failed to submit task' };
    }

    // Add automatic comment
    const comment = {
      id: crypto.randomUUID(),
      taskId,
      userId,
      userName: user.displayName || user.email || 'Unknown',
      userRole: user.orgRole,
      content: `Submitted work for review${notes ? `: ${notes}` : ''}`,
      commentType: 'RESPONSE' as const,
      attachments,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentComments = task.comments || [];
    await taskService.update(orgId, taskId, {
      comments: [...currentComments, comment],
    });

    return { success: true, data: submission, message: 'Task submitted for review' };
  });

/**
 * Review task submission (approve/reject/request changes)
 * Only ADMIN/OWNER can review
 */
export const reviewTaskSubmissionAction = orgActionClient
  .schema(
    z.object({
      taskId: z.string(),
      action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
      reviewNotes: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { taskId, action, reviewNotes } = parsedInput;
    const { orgId, userId, user } = ctx;

    // Only ADMIN/OWNER can review
    if (user.orgRole !== 'ADMIN' && user.orgRole !== 'OWNER') {
      return { success: false, message: 'Only admins can review tasks' };
    }

    // Get the task
    const taskResult = await taskService.getById(orgId, taskId);
    if (!taskResult.success || !taskResult.data) {
      return { success: false, message: 'Task not found' };
    }

    const task = taskResult.data;

    // Verify task has a submission
    if (!task.currentSubmission || task.status !== 'SUBMITTED') {
      return { success: false, message: 'No submission to review' };
    }

    // Update submission with review
    const updatedSubmission = {
      ...task.currentSubmission,
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      reviewedBy: userId,
      reviewedAt: new Date(),
      reviewNotes,
    };

    // Determine new task status
    let newStatus: string;
    let commentType: 'APPROVAL' | 'REJECTION' | 'FEEDBACK';
    let commentContent: string;

    if (action === 'APPROVE') {
      newStatus = 'APPROVED';
      commentType = 'APPROVAL';
      commentContent = `Approved submission${reviewNotes ? `: ${reviewNotes}` : ''}`;
    } else if (action === 'REJECT') {
      newStatus = 'CHANGES_REQUESTED';
      commentType = 'REJECTION';
      commentContent = `Rejected submission${reviewNotes ? `: ${reviewNotes}` : ''}`;
    } else {
      newStatus = 'CHANGES_REQUESTED';
      commentType = 'FEEDBACK';
      commentContent = `Requested changes${reviewNotes ? `: ${reviewNotes}` : ''}`;
    }

    // Update submissions array
    const submissions = task.submissions || [];
    const updatedSubmissions = submissions.map((s) =>
      s.id === updatedSubmission.id ? updatedSubmission : s
    );

    // Update task
    const updateResult = await taskService.update(orgId, taskId, {
      status: newStatus,
      submissions: updatedSubmissions,
      currentSubmission: updatedSubmission,
    });

    if (!updateResult.success) {
      return { success: false, message: 'Failed to review task' };
    }

    // Add review comment
    const comment = {
      id: crypto.randomUUID(),
      taskId,
      userId,
      userName: user.displayName || user.email || 'Unknown',
      userRole: user.orgRole,
      content: commentContent,
      commentType,
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentComments = task.comments || [];
    await taskService.update(orgId, taskId, {
      comments: [...currentComments, comment],
    });

    return {
      success: true,
      data: { submission: updatedSubmission, newStatus },
      message: `Task ${action.toLowerCase()}`,
    };
  });

/**
 * Mark task as done
 * Only ADMIN/OWNER can mark task as done after it's approved
 */
export const markTaskAsDoneAction = orgActionClient
  .schema(
    z.object({
      taskId: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { taskId } = parsedInput;
    const { orgId, user } = ctx;

    // Only ADMIN/OWNER can mark as done
    if (user.orgRole !== 'ADMIN' && user.orgRole !== 'OWNER') {
      return { success: false, message: 'Only admins can mark tasks as done' };
    }

    // Get the task
    const taskResult = await taskService.getById(orgId, taskId);
    if (!taskResult.success || !taskResult.data) {
      return { success: false, message: 'Task not found' };
    }

    const task = taskResult.data;

    // Verify task is approved
    if (task.status !== 'APPROVED') {
      return { success: false, message: 'Task must be approved before marking as done' };
    }

    // Update task status
    const updateResult = await taskService.update(orgId, taskId, {
      status: 'DONE',
    });

    if (!updateResult.success) {
      return { success: false, message: 'Failed to mark task as done' };
    }

    return { success: true, message: 'Task marked as done' };
  });
