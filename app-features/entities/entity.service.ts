import { AbstractService } from '@/core/abstract-service/AbstractService';
import { Result } from '@/lib/types';
import 'server-only';
import { Entity, EntityInput } from './entity.model';
import { getEntityRepository } from './entity.repository';

/**
 * Entity Management Service
 * 
 * Provides business logic for managing construction/architecture entities
 * (Clients, Vendors, Contractors, Consultants) with full CRUD operations.
 * 
 * All operations are tenant-isolated and include:
 * - Circuit breaker protection
 * - Automatic retry logic
 * - Operation tracing
 * - Error standardization
 * 
 * @extends AbstractService
 * 
 * @example
 * ```ts
 * // Create a new client entity
 * const result = await entityService.create('org-123', {
 *   name: 'Acme Construction',
 *   type: EntityType.CLIENT,
 *   email: 'contact@acme.com',
 *   status: EntityStatus.ACTIVE
 * });
 * 
 * if (result.success) {
 *   console.log('Created entity:', result.data);
 * }
 * ```
 */
class EntityService extends AbstractService {
  /**
   * Create a new entity
   * 
   * @param orgId - Organization ID for tenant isolation
   * @param data - Entity data without auto-generated fields
   * @returns Result containing the created entity with generated ID and timestamps
   * 
   * @example
   * ```ts
   * const result = await entityService.create('org-123', {
   *   name: 'ABC Contractors',
   *   type: EntityType.CONTRACTOR,
   *   phone: '555-0123',
   *   tags: ['roofing', 'commercial']
   * });
   * ```
   */
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

  /**
   * List all entities for an organization
   * 
   * @param orgId - Organization ID for tenant isolation
   * @returns Result containing array of all entities (active and inactive)
   * 
   * @example
   * ```ts
   * const result = await entityService.list('org-123');
   * if (result.success) {
   *   const clients = result.data.filter(e => e.type === EntityType.CLIENT);
   * }
   * ```
   */
  async list(orgId: string): Promise<Result<Entity[]>> {
    return this.handleOperation('list-entities', async () => {
      const repo = getEntityRepository(orgId);
      const result = await repo.list({});
      return result.data;
    });
  }

  /**
   * Get a single entity by ID
   * 
   * @param orgId - Organization ID for tenant isolation
   * @param id - Entity ID
   * @returns Result containing the entity
   * @throws RepositoryError if entity not found
   * 
   * @example
   * ```ts
   * const result = await entityService.get('org-123', 'entity-456');
   * if (result.success) {
   *   console.log('Entity name:', result.data.name);
   * }
   * ```
   */
  async get(orgId: string, id: string): Promise<Result<Entity>> {
    return this.handleOperation('get-entity', async () => {
      return await getEntityRepository(orgId).get(id);
    });
  }

  /**
   * Update an existing entity
   * 
   * @param orgId - Organization ID for tenant isolation
   * @param id - Entity ID to update
   * @param data - Partial entity data (only fields to update)
   * @returns Result indicating success/failure
   * 
   * @example
   * ```ts
   * const result = await entityService.update('org-123', 'entity-456', {
   *   status: EntityStatus.INACTIVE,
   *   notes: 'Contract expired'
   * });
   * ```
   */
  async update(orgId: string, id: string, data: Partial<Entity>): Promise<Result<void>> {
    return this.handleOperation('update-entity', async () => {
      await getEntityRepository(orgId).update(id, data);
    });
  }

  /**
   * Delete an entity (hard delete)
   * 
   * @param orgId - Organization ID for tenant isolation
   * @param id - Entity ID to delete
   * @returns Result indicating success/failure
   * 
   * @example
   * ```ts
   * const result = await entityService.delete('org-123', 'entity-456');
   * if (result.success) {
   *   console.log('Entity permanently deleted');
   * }
   * ```
   */
  async delete(orgId: string, id: string): Promise<Result<void>> {
    return this.handleOperation('delete-entity', async () => {
      // Soft Delete: Set deletedAt
      await getEntityRepository(orgId).forceDelete(id);
    });
  }
}

/**
 * Singleton instance of EntityService
 * Use this export for all entity operations
 * 
 * @example
 * ```ts
 * import { entityService } from '@/app-features/entities/entity.service';
 * 
 * const entities = await entityService.list(orgId);
 * ```
 */
export const entityService = new EntityService();
