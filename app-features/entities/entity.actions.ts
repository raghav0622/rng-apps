'use server';

import { orgActionClient } from '@/core/safe-action/safe-action';
import { z } from 'zod';
import { EntitySchema } from './entity.model';
import { entityService } from './entity.service';

/**
 * Create Entity Input Schema
 * Omits auto-generated fields (id, orgId, timestamps)
 */
const CreateEntityInput = EntitySchema.omit({
  id: true,
  orgId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

/**
 * Create a new entity (Server Action)
 * 
 * Requires organization context and authentication.
 * Automatically includes tenant isolation.
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { useRngAction } from '@/core/safe-action/use-rng-action';
 * import { createEntityAction } from '@/app-features/entities/entity.actions';
 * 
 * const { execute } = useRngAction(createEntityAction);
 * 
 * const handleCreate = async () => {
 *   const result = await execute({
 *     name: 'ABC Contractors',
 *     type: EntityType.CONTRACTOR,
 *     email: 'info@abc.com'
 *   });
 * };
 * ```
 */
export const createEntityAction = orgActionClient
  .metadata({ name: 'create-entity' })
  .schema(CreateEntityInput)
  .action(async ({ parsedInput, ctx }) => {
    return await entityService.create(ctx.orgId, parsedInput);
  });

/**
 * Get all entities for current organization (Server Action)
 * 
 * Returns all entities (clients, vendors, contractors, consultants)
 * for the authenticated user's organization.
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { useRngAction } from '@/core/safe-action/use-rng-action';
 * import { getEntitiesAction } from '@/app-features/entities/entity.actions';
 * 
 * const { execute, result } = useRngAction(getEntitiesAction);
 * 
 * useEffect(() => {
 *   execute({});
 * }, [execute]);
 * 
 * const entities = result.data?.success ? result.data.data : [];
 * ```
 */
export const getEntitiesAction = orgActionClient
  .metadata({ name: 'list-entities' })
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    return await entityService.list(ctx.orgId);
  });

/**
 * Update an existing entity (Server Action)
 * 
 * Allows partial updates - only provided fields will be modified.
 * Requires organization context and authentication.
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { useRngAction } from '@/core/safe-action/use-rng-action';
 * import { updateEntityAction } from '@/app-features/entities/entity.actions';
 * 
 * const { execute } = useRngAction(updateEntityAction);
 * 
 * const handleUpdate = async (id: string) => {
 *   await execute({
 *     id,
 *     data: {
 *       status: EntityStatus.INACTIVE,
 *       notes: 'No longer working with this vendor'
 *     }
 *   });
 * };
 * ```
 */
export const updateEntityAction = orgActionClient
  .metadata({ name: 'update-entity' })
  .schema(
    z.object({
      id: z.string(),
      data: EntitySchema.omit({
        id: true,
        orgId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      }).partial(), // All fields optional for update
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    return await entityService.update(ctx.orgId, parsedInput.id, parsedInput.data);
  });

/**
 * Delete an entity (Server Action)
 * 
 * Permanently removes the entity from the database.
 * Requires organization context and authentication.
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { useRngAction } from '@/core/safe-action/use-rng-action';
 * import { deleteEntityAction } from '@/app-features/entities/entity.actions';
 * 
 * const { execute } = useRngAction(deleteEntityAction);
 * 
 * const handleDelete = async (id: string) => {
 *   if (confirm('Delete this entity?')) {
 *     await execute({ id });
 *   }
 * };
 * ```
 */
export const deleteEntityAction = orgActionClient
  .metadata({ name: 'delete-entity' })
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    return await entityService.delete(ctx.orgId, parsedInput.id);
  });
