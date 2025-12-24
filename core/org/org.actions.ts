'use server';

import { authActionClient, orgActionClient } from '@/core/safe-action/safe-action';
import { AppPermission } from '@/lib/action-policies';
import { CreateOrgSchema, UpdateOrgSchema } from './org.model';
import { organizationService } from './org.service';

/**
 * Action: Create Organization
 * Protected by: Auth Only (User needs to be logged in, but NOT necessarily in an org yet)
 */
export const createOrganizationAction = authActionClient
  .metadata({ name: 'org.create' })
  .schema(CreateOrgSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await organizationService.createOrganization(ctx.userId, parsedInput);
  });

/**
 * Action: Update Organization
 * Protected by: Org Context + ORG_UPDATE Permission (Owners/Admins)
 */
export const updateOrganizationAction = orgActionClient
  .metadata({
    name: 'org.update',
    permissions: [AppPermission.ORG_UPDATE],
  })
  .schema(UpdateOrgSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await organizationService.updateOrganization(ctx.orgId, parsedInput);
  });
