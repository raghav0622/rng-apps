import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { cache } from 'react';
import 'server-only';
import { Entity, EntitySchema } from './entity.model';

/**
 * Entity Repository
 * 
 * Provides data access layer for construction/architecture entities with:
 * - Tenant isolation (scoped to organization)
 * - Schema validation using Zod
 * - Soft delete capabilities
 * - Automatic timestamp management
 * - Caching support
 * 
 * @extends AbstractFirestoreRepository<Entity>
 * 
 * @example
 * ```ts
 * const repo = getEntityRepository('org-123');
 * 
 * // Create
 * const entity = await repo.create('entity-456', {
 *   name: 'Acme Corp',
 *   type: EntityType.CLIENT
 * });
 * 
 * // Query
 * const { data } = await repo.list({
 *   where: [{ field: 'type', op: '==', value: EntityType.VENDOR }]
 * });
 * ```
 */
class EntityRepository extends AbstractFirestoreRepository<Entity> {
  /**
   * Creates a new EntityRepository instance scoped to an organization
   * 
   * @param orgId - Organization ID for tenant isolation
   */
  constructor(orgId: string) {
    super(`organizations/${orgId}/entities`, { schema: EntitySchema });
    this.defaultCreateOverrides = { orgId } as unknown as Partial<Entity>;
  }
}

/**
 * Get a cached EntityRepository instance for an organization
 * 
 * This function is cached per-request to ensure singleton behavior
 * and optimal performance within a single request lifecycle.
 * 
 * @param orgId - Organization ID for tenant isolation
 * @returns Cached EntityRepository instance
 * 
 * @example
 * ```ts
 * // These will return the same instance within a request
 * const repo1 = getEntityRepository('org-123');
 * const repo2 = getEntityRepository('org-123');
 * console.log(repo1 === repo2); // true
 * ```
 */
export const getEntityRepository = cache((orgId: string) => {
  return new EntityRepository(orgId);
});
