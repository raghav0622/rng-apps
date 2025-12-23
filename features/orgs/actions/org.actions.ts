'use server';

import { AppPermission } from '@/lib/action-policies';
import { serializeFirestoreData } from '@/lib/firebase/utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { authActionClient, orgActionClient } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { CreateOrganizationSchema, UpdateOrganizationSchema } from '../org.model';
import { orgRepository } from '../repositories/org.repository';
import { OrgService } from '../services/org.service';

// ----------------------------------------------------------------------------
// Create Organization
// ----------------------------------------------------------------------------
// Uses 'authActionClient' because the user DOES NOT have an org yet.
export const createOrganizationAction = authActionClient
  .metadata({ name: 'org.create' })
  .inputSchema(CreateOrganizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    await checkRateLimit();

    const result = await OrgService.createOrganization(ctx.userId, parsedInput);

    if (result.success) {
      revalidatePath('/dashboard'); // Refresh to show new org context
    }

    return result;
  });

// ----------------------------------------------------------------------------
// Update Organization
// ----------------------------------------------------------------------------
// Uses 'orgActionClient' because it requires an active org context.
// Requires 'ORG_UPDATE' permission (Owner/Admin).
export const updateOrganizationAction = orgActionClient
  .metadata({
    name: 'org.update',
    permissions: [AppPermission.ORG_UPDATE],
  })
  .inputSchema(UpdateOrganizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Ensure the user is updating the org they are actually in
    if (parsedInput.organizationId !== ctx.orgId) {
      throw new Error('Integrity Error: Organization ID mismatch.');
    }

    const result = await OrgService.updateOrganization(ctx.orgId, {
      name: parsedInput.name,
    });

    if (result.success) {
      revalidatePath('/dashboard');
    }

    return result;
  });

export const getOrganizationAction = orgActionClient
  .metadata({ name: 'org.get' })
  .action(async ({ ctx }) => {
    // Uses your existing orgRepository to fetch the org by the context's orgId
    const org = await orgRepository.getById(ctx.orgId);

    if (!org) {
      return { success: false, error: 'Organization not found' };
    }

    // Ensures Firestore data is sanitized for the client
    return { success: true, data: serializeFirestoreData(org) };
  });
