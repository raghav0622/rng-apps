'use server';

import { UserRoleInOrg } from '@/core/action-policies';
import { orgActionClient } from '@/core/safe-action/safe-action';
import { z } from 'zod';
import { TaskSchema, TaskStatus, TimeLogSchema } from './task.model';
import { taskService } from './task.service';

// Create Task Action
export const createTaskAction = orgActionClient
  .metadata({ name: 'create-task' })
  .schema(
    TaskSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true, deletedAt: true }),
  )
  .action(async ({ parsedInput, ctx }) => {
    return await taskService.create(ctx.orgId, parsedInput);
  });

// List Tasks Action
export const getTasksAction = orgActionClient
  .metadata({ name: 'list-tasks' })
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    return await taskService.list(ctx.orgId);
  });

// Get Single Task Action
export const getTaskAction = orgActionClient
  .metadata({ name: 'get-task' })
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    return await taskService.get(ctx.orgId, parsedInput.id);
  });

// Update Task Action
export const updateTaskAction = orgActionClient
  .metadata({ name: 'update-task' })
  .schema(
    z.object({
      id: z.string(),
      data: TaskSchema.omit({
        id: true,
        orgId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      }).partial(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    return await taskService.update(ctx.orgId, parsedInput.id, parsedInput.data);
  });

// Delete Task Action
export const deleteTaskAction = orgActionClient
  .metadata({ name: 'delete-task' })
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    return await taskService.delete(ctx.orgId, parsedInput.id);
  });

// Update Task Status Action
export const updateTaskStatusAction = orgActionClient
  .metadata({ name: 'update-task-status' })
  .schema(z.object({ taskId: z.string(), status: z.nativeEnum(TaskStatus) }))
  .action(async ({ parsedInput, ctx }) => {
    const isReviewer = [UserRoleInOrg.ADMIN, UserRoleInOrg.OWNER].includes(ctx.role);
    return await taskService.updateStatus(
      ctx.orgId,
      parsedInput.taskId,
      parsedInput.status,
      ctx.userId,
      isReviewer,
    );
  });

// Log Time Action
export const logTimeAction = orgActionClient
  .metadata({ name: 'log-task-time' })
  .schema(z.object({ taskId: z.string(), log: TimeLogSchema }))
  .action(async ({ parsedInput, ctx }) => {
    return await taskService.logTime(ctx.orgId, parsedInput.taskId, parsedInput.log);
  });
