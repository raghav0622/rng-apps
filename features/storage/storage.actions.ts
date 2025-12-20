// features/storage/storage.actions.ts
'use server';

import { authActionClient } from '@/lib/safe-action';
import { zfd } from 'zod-form-data';
import { StorageService } from './storage.service';

// Use zod-form-data to strictly validate multipart/form-data input
const UploadAvatarSchema = zfd.formData({
  file: zfd.file(),
});

export const uploadAvatarAction = authActionClient
  .metadata({ name: 'storage.uploadAvatar' })
  .inputSchema(UploadAvatarSchema)
  .action(async ({ ctx, parsedInput }) => {
    // parsedInput.file is a validated File object
    const url = await StorageService.uploadAvatar(ctx.userId, parsedInput.file);
    return { url };
  });
