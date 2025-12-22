// features/storage/storage.actions.ts
'use server';

import { authActionClient } from '@/lib/safe-action';
import { zfd } from 'zod-form-data';
import { StorageService } from './storage.service';

const UploadAvatarSchema = zfd.formData({
  file: zfd.file(),
});

export const uploadAvatarAction = authActionClient
  .metadata({ name: 'storage.uploadAvatar' })
  .inputSchema(UploadAvatarSchema)
  .action(async ({ ctx, parsedInput }) => {
    // Now returns Result<{ url: string }>
    return await StorageService.uploadAvatar(ctx.userId, parsedInput.file);
  });
