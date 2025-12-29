import { AbstractService } from '@/core/abstract-service/AbstractService';
import { Result } from '@/lib/types';
import 'server-only';
import { Entity, EntityInput } from './entity.model';
import { getEntityRepository } from './entity.repository';

class EntityService extends AbstractService {
  async create(
    orgId: string,
    data: Omit<EntityInput, 'id' | 'orgId' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Result<Entity>> {
    return this.handleOperation('create-entity', async () => {
      const repo = getEntityRepository(orgId);
      const id = repo['collection'].doc().id;
      return await repo.create(id, data);
    });
  }

  async list(orgId: string): Promise<Result<Entity[]>> {
    return this.handleOperation('list-entities', async () => {
      const repo = getEntityRepository(orgId);
      const result = await repo.list({});
      return result.data;
    });
  }

  async get(orgId: string, id: string): Promise<Result<Entity>> {
    return this.handleOperation('get-entity', async () => {
      return await getEntityRepository(orgId).get(id);
    });
  }

  async update(orgId: string, id: string, data: Partial<Entity>): Promise<Result<void>> {
    return this.handleOperation('update-entity', async () => {
      await getEntityRepository(orgId).update(id, data);
    });
  }

  async delete(orgId: string, id: string): Promise<Result<void>> {
    return this.handleOperation('delete-entity', async () => {
      // Soft Delete: Set deletedAt
      await getEntityRepository(orgId).forceDelete(id);
    });
  }
}

export const entityService = new EntityService();
