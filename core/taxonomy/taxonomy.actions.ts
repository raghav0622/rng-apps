'use server';

import { orgActionClient } from '@/core/safe-action/safe-action';
import { z } from 'zod';
import { taxonomyService } from './taxonomy.service';

export const getTaxonomyOptionsAction = orgActionClient
  .metadata({ name: 'get-taxonomy-options' })
  .schema(z.object({ scope: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    return await taxonomyService.getOptions(ctx.orgId, parsedInput.scope);
  });

export const createTaxonomyOptionAction = orgActionClient
  .metadata({ name: 'create-taxonomy-option' })
  .schema(z.object({ scope: z.string(), label: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    return await taxonomyService.createOption(ctx.orgId, parsedInput.scope, parsedInput.label);
  });
