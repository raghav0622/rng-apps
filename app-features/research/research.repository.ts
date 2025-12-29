import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { cache } from 'react';
import 'server-only';
import { ResearchItem, ResearchItemSchema } from './research.model';

class ResearchRepository extends AbstractFirestoreRepository<ResearchItem> {
  constructor(orgId: string) {
    super(`organizations/${orgId}/research_items`, { schema: ResearchItemSchema });
    this.defaultCreateOverrides = { orgId } as unknown as Partial<ResearchItem>;
  }
}

export const getResearchRepository = cache((orgId: string) => {
  return new ResearchRepository(orgId);
});
