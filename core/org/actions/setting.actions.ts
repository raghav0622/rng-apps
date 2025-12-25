'use server';

import { orgActionClient } from '@/core/safe-action/safe-action';
import { AppPermission } from '@/lib/action-policies';
import { revalidatePath } from 'next/cache';
import { settingsService } from '../services/settings.service';
import { UpdateSettingsSchema } from '../settings.model';

export const updateSettingsAction = orgActionClient
  .metadata({
    name: 'settings.update',
    permissions: [AppPermission.ORG_UPDATE],
  })
  .schema(UpdateSettingsSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await settingsService.updateSettings(ctx.orgId, parsedInput);
    revalidatePath('/settings');
    return result;
  });
