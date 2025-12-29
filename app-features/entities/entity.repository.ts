import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { cache } from 'react';
import 'server-only';
import { Entity, EntitySchema } from './entity.model';

class EntityRepository extends AbstractFirestoreRepository<Entity> {
  constructor(orgId: string) {
    super(`organizations/${orgId}/entities`, { schema: EntitySchema });
    this.defaultCreateOverrides = { orgId } as unknown as Partial<Entity>;
  }
}

// ⚡ CACHED EXPORT: Guarantees singleton-per-request for this Org
export const getEntityRepository = cache((orgId: string) => {
  return new EntityRepository(orgId);
});
