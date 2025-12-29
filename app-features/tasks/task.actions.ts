'use server';

import { UserRoleInOrg } from '@/core/action-policies';
import { orgActionClient } from '@/core/safe-action/safe-action';
import { z } from 'zod';
import { TaskSchema, TaskStatus } from './task.model';
import { taskService } from './task.service';

// ... (Input Schemas same as before) ...

export const createTaskAction = orgActionClient
  .metadata({ name: 'create-task' })
  .schema(
    TaskSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true, deletedAt: true }),
  )
  .action(async ({ parsedInput, ctx }) => {
    return await taskService.create(ctx.orgId, parsedInput);
  });

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
