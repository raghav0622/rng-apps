// features/storage/storage.service.ts
import { AppErrorCode, CustomError } from '@/lib/errors';
import { Result } from '@/lib/types';
import 'server-only';
import { storageRepository } from './storage.repository';

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const StorageService = {
  /**
   * Uploads an avatar for the given user.
   */
  async uploadAvatar(userId: string, input: FormData | File): Promise<Result<{ url: string }>> {
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

    const url = await storageRepository.uploadFile(path, buffer, file.type);

    return { success: true, data: { url } };
  },

  /**
   * Deletes a file given its public URL.
   * Extracts the path from the URL and calls the repository.
   */
  async deleteFileByUrl(publicUrl: string): Promise<void> {
    if (!publicUrl) return;

    try {
      const path = this.extractPathFromUrl(publicUrl);
      if (path) {
        await storageRepository.deleteFile(path);
      }
    } catch (error) {
      console.warn('Failed to extract path or delete file:', error);
    }
  },

  /**
   * Helper to extract the storage path from a standard Firebase/Google Storage Public URL.
   */
  extractPathFromUrl(url: string): string | null {
    try {
      if (!url.includes('storage.googleapis.com')) return null;
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // pathParts[0] is empty, pathParts[1] is bucket name
      if (pathParts.length > 2) {
        return decodeURIComponent(pathParts.slice(2).join('/'));
      }
      return null;
    } catch (e) {
      return null;
    }
  },
};
