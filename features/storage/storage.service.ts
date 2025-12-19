// features/storage/storage.service.ts
import { AppErrorCode, CustomError } from '@/lib/errors';
import 'server-only';
import { storageRepository } from './storage.repository';

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const StorageService = {
  /**
   * Uploads an avatar for the given user.
   * Accepts FormData (from raw actions) or File (from safe-actions).
   */
  async uploadAvatar(userId: string, input: FormData | File): Promise<string> {
    let file: File | null = null;

    if (input instanceof FormData) {
      file = input.get('file') as File;
    } else {
      file = input;
    }

    if (!file) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'No file provided');
    }

    if (file.size > MAX_SIZE) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'File size exceeds 5MB limit');
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new CustomError(
        AppErrorCode.INVALID_INPUT,
        `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Path: users/{uid}/avatar-{timestamp} to avoid caching issues
    const path = `users/${userId}/avatar-${Date.now()}`;

    return await storageRepository.uploadFile(path, buffer, file.type);
  },
};
