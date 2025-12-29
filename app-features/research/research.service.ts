import { AbstractService } from '@/core/abstract-service/AbstractService';
import { Result } from '@/lib/types';
import 'server-only';
import { z } from 'zod';
import { ResearchItem, ResearchItemSchema } from './research.model';
import { getResearchRepository } from './research.repository';

type CreateResearchInput = z.infer<typeof ResearchItemSchema>;

class ResearchService extends AbstractService {
  async create(orgId: string, data: Partial<CreateResearchInput>): Promise<Result<ResearchItem>> {
    return this.handleOperation('create-research', async () => {
      const repo = getResearchRepository(orgId);
      const id = repo['collection'].doc().id;
      return await repo.create(id, data as any);
    });
  }

  async list(orgId: string): Promise<Result<ResearchItem[]>> {
    return this.handleOperation('list-research', async () => {
      const result = await getResearchRepository(orgId).list({});
      return result.data;
    });
  }
}

export const researchService = new ResearchService();
