import { AbstractService } from '@/core/abstract-service/AbstractService';
import { Result } from '@/lib/types';
import 'server-only';
import { Project } from './project.model';
import { getProjectRepository } from './project.repository';

class ProjectService extends AbstractService {
  async create(orgId: string, data: Partial<Project>): Promise<Result<Project>> {
    return this.handleOperation('create-project', async () => {
      const repo = getProjectRepository(orgId);
      const id = repo['collection'].doc().id;
      return await repo.create(id, data as any);
    });
  }

  async list(orgId: string): Promise<Result<Project[]>> {
    return this.handleOperation('list-projects', async () => {
      const result = await getProjectRepository(orgId).list({});
      return result.data;
    });
  }

  async get(orgId: string, projectId: string): Promise<Result<Project>> {
    return this.handleOperation('get-project', async () => {
      return await getProjectRepository(orgId).get(projectId);
    });
  }
}

export const projectService = new ProjectService();
