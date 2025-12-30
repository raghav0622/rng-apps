import { AbstractService } from '@/core/abstract-service/AbstractService';
import { AppErrorCode, CustomError } from '@/core/utils/errors';
import { Result } from '@/lib/types';
import 'server-only';
import { Task, TaskStatus, TimeLog } from './task.model';
import { getTaskRepository } from './task.repository';

class TaskService extends AbstractService {
  async create(orgId: string, data: Partial<Task>): Promise<Result<Task>> {
    return this.handleOperation('create-task', async () => {
      const repo = getTaskRepository(orgId);
      const id = repo['collection'].doc().id;
      return await repo.create(id, data as any);
    });
  }

  async list(orgId: string): Promise<Result<Task[]>> {
    return this.handleOperation('list-tasks', async () => {
      const result = await getTaskRepository(orgId).list({});
      return result.data;
    });
  }

  async get(orgId: string, taskId: string): Promise<Result<Task>> {
    return this.handleOperation('get-task', async () => {
      return await getTaskRepository(orgId).get(taskId);
    });
  }

  // Alias for getById to match action usage
  async getById(orgId: string, taskId: string): Promise<Result<Task>> {
    return this.get(orgId, taskId);
  }

  async update(orgId: string, taskId: string, data: Partial<Task>): Promise<Result<void>> {
    return this.handleOperation('update-task', async () => {
      await getTaskRepository(orgId).update(taskId, data);
    });
  }

  async delete(orgId: string, taskId: string): Promise<Result<void>> {
    return this.handleOperation('delete-task', async () => {
      await getTaskRepository(orgId).forceDelete(taskId);
    });
  }

  async updateStatus(
    orgId: string,
    taskId: string,
    newStatus: TaskStatus,
    actorId: string,
    isReviewer: boolean,
  ): Promise<Result<void>> {
    return this.handleOperation('update-task-status', async () => {
      const repo = getTaskRepository(orgId);
      const task = await repo.get(taskId);

      if (newStatus === TaskStatus.DONE && !isReviewer) {
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Only reviewers can mark DONE.');
      }
      if (task.assignedTo && task.assignedTo !== actorId && !isReviewer) {
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Not assigned to you.');
      }

      await repo.update(taskId, { status: newStatus });
    });
  }

  async logTime(orgId: string, taskId: string, log: TimeLog): Promise<Result<void>> {
    return this.handleOperation('log-task-time', async () => {
      const repo = getTaskRepository(orgId);
      const task = await repo.get(taskId);
      const newLogs = [...task.timeLogs, log];
      await repo.update(taskId, { timeLogs: newLogs });
    });
  }
}

export const taskService = new TaskService();
