'use server';

import { orgActionClient } from '@/core/safe-action/safe-action';
import { z } from 'zod';
import { EntitySchema } from './entity.model';
import { entityService } from './entity.service';

const CreateEntityInput = EntitySchema.omit({
  id: true,
  orgId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const createEntityAction = orgActionClient
  .metadata({ name: 'create-entity' })
  .schema(CreateEntityInput)
  .action(async ({ parsedInput, ctx }) => {
    return await entityService.create(ctx.orgId, parsedInput);
  });

export const getEntitiesAction = orgActionClient
  .metadata({ name: 'list-entities' })
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    return await entityService.list(ctx.orgId);
  });

// ✅ Update Action
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

// ✅ Delete Action
export const deleteEntityAction = orgActionClient
  .metadata({ name: 'delete-entity' })
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    return await entityService.delete(ctx.orgId, parsedInput.id);
  });
