import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { cache } from 'react';
import 'server-only';
import { Project, ProjectSchema } from './project.model';

export class ProjectRepository extends AbstractFirestoreRepository<Project> {
  constructor(orgId: string) {
    super(`organizations/${orgId}/projects`, { schema: ProjectSchema });
    this.defaultCreateOverrides = { orgId } as unknown as Partial<Project>;
  }
}

export const getProjectRepository = cache((orgId: string) => {
  return new ProjectRepository(orgId);
});
