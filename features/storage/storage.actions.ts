// features/storage/storage.actions.ts
'use server';

import { getCurrentUser } from '@/features/auth/session';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { StorageService } from './storage.service';

/**
 * Standard Server Action that accepts FormData.
 * We manually verify the session here since we aren't using the authActionClient wrapper
 * which is designed for JSON inputs.
 */
export async function uploadAvatarAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'You must be logged in to upload files');
  }

  try {
    const url = await StorageService.uploadAvatar(user.uid, formData);
    return { success: true, url };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}
