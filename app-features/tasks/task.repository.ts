import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { cache } from 'react';
import 'server-only';
import { Task, TaskSchema } from './task.model';

export class TaskRepository extends AbstractFirestoreRepository<Task> {
  constructor(orgId: string) {
    super(`organizations/${orgId}/tasks`, { schema: TaskSchema });
    this.defaultCreateOverrides = { orgId } as unknown as Partial<Task>;
  }
}

export const getTaskRepository = cache((orgId: string) => {
  return new TaskRepository(orgId);
});
