// features/storage/storage.actions.ts
'use server';

import { getCurrentUser } from '@/features/auth/session';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { StorageService } from './storage.service';

/**
 * Custom return type to match next-safe-action structure.
 * This allows the frontend to handle errors consistently.
 */
type ActionResponse<T> =
  | { data: T; serverError: null }
  | { data: null; serverError: { message: string; code?: string } };

export async function uploadAvatarAction(
  formData: FormData,
): Promise<ActionResponse<{ url: string }>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'You must be logged in to upload files');
    }

    const url = await StorageService.uploadAvatar(user.uid, formData);
    return { data: { url }, serverError: null };
  } catch (error: any) {
    // Log error internally here if needed
    return {
      data: null,
      serverError: {
        message: error.message || 'Upload failed',
        code: error instanceof CustomError ? error.code : AppErrorCode.UNKNOWN,
      },
    };
  }
}
