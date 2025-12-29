import { AbstractService } from '@/core/abstract-service/AbstractService';
import { Result } from '@/lib/types';
import 'server-only';
import { TaxonomyItem } from './taxonomy.model';
import { getTaxonomyRepository } from './taxonomy.repository';

class TaxonomyService extends AbstractService {
  async getOptions(orgId: string, scope: string): Promise<Result<TaxonomyItem[]>> {
    return this.handleOperation('get-taxonomy', async () => {
      const repo = getTaxonomyRepository(orgId);

      // 🛠️ FIX: Use Object Syntax for Where Clause
      const result = await repo.list({
        where: [{ field: 'scope', op: '==', value: scope }],
      });

      return result.data.sort((a, b) => a.label.localeCompare(b.label));
    });
  }

  async createOption(orgId: string, scope: string, label: string): Promise<Result<TaxonomyItem>> {
    return this.handleOperation('create-taxonomy-option', async () => {
      const repo = getTaxonomyRepository(orgId);

      // 🛠️ FIX: Use Object Syntax for Idempotency Check too
      const existing = await repo.list({
        where: [
          { field: 'scope', op: '==', value: scope },
          { field: 'value', op: '==', value: label.trim() },
        ],
      });

      if (existing.data.length > 0) {
        return existing.data[0];
      }

      const id = repo['collection'].doc().id;
      return await repo.create(id, {
        scope,
        label: label.trim(),
        value: label.trim(),
      } as any);
    });
  }
}

export const taxonomyService = new TaxonomyService();
