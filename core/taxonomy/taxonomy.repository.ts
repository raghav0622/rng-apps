import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { cache } from 'react';
import 'server-only';
import { TaxonomyItem, TaxonomySchema } from './taxonomy.model';

export class TaxonomyRepository extends AbstractFirestoreRepository<TaxonomyItem> {
  constructor(orgId: string) {
    super(`organizations/${orgId}/taxonomies`, { schema: TaxonomySchema });
    this.defaultCreateOverrides = { orgId } as unknown as Partial<TaxonomyItem>;
  }
}

export const getTaxonomyRepository = cache((orgId: string) => new TaxonomyRepository(orgId));
