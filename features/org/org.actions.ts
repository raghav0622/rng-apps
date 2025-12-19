'use server';

import { authActionClient } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { CreateOrgSchema, UpdateOrgSchema } from './org.model';
import { OrgService } from './org.service';

export const createOrganizationAction = authActionClient
  .schema(CreateOrgSchema)
  .metadata({ name: 'create-organization' })
  .action(async ({ parsedInput, ctx }) => {
    const result = await OrgService.createOrganization(ctx.userId, parsedInput, ctx.traceId);

    if (result.success) {
      revalidatePath('/dashboard');
    }

    return result;
  });

export const updateOrganizationAction = authActionClient
  .schema(UpdateOrgSchema)
  .metadata({ name: 'update-organization' })
  .action(async ({ parsedInput, ctx }) => {
    const result = await OrgService.updateOrganization(ctx.userId, parsedInput, ctx.traceId);
    if (result.success) {
      revalidatePath('/dashboard');
    }
    return result;
  });
