// features/storage/storage.service.ts
import { AppErrorCode, CustomError } from '@/lib/errors';
import { Result } from '@/lib/types';
import 'server-only';
import { storageRepository } from './storage.repository';

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const StorageService = {
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
    // Path: users/{uid}/avatar-{timestamp}
    // Using timestamp ensures CDN caches don't serve old images
    const path = `users/${userId}/avatar-${Date.now()}`;

    const url = await storageRepository.uploadFile(path, buffer, file.type);

    return { success: true, data: { url } };
  },

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

  extractPathFromUrl(url: string): string | null {
    try {
      // Handle both standard Google Storage URLs and Firebase Download URLs
      const urlObj = new URL(url);

      // Case 1: storage.googleapis.com/BUCKET/PATH
      if (urlObj.hostname === 'storage.googleapis.com') {
        const pathParts = urlObj.pathname.split('/');
        // pathParts[0] is empty, pathParts[1] is bucket
        if (pathParts.length > 2) {
          return decodeURIComponent(pathParts.slice(2).join('/'));
        }
      }

      // Case 2: firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH
      if (urlObj.hostname === 'firebasestorage.googleapis.com') {
        const pathStartIndex = urlObj.pathname.indexOf('/o/');
        if (pathStartIndex !== -1) {
          const encodedPath = urlObj.pathname.substring(pathStartIndex + 3);
          return decodeURIComponent(encodedPath);
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  },
};
