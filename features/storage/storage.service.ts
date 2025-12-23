import { AppErrorCode, CustomError } from '@/lib/errors';
import { Result } from '@/lib/types';
import 'server-only';
import { AVATAR_ALLOWED_TYPES, AVATAR_MAX_SIZE } from './storage.config';
import { storageRepository } from './storage.repository';

import 'server-only';

export class StorageService {
  static async uploadAvatar(
    userId: string,
    input: FormData | File,
  ): Promise<Result<{ url: string }>> {
    let file: File | null = null;

    if (input instanceof FormData) {
      file = input.get('file') as File;
    } else if (input instanceof File) {
      file = input;
    }

    if (!file) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'No file provided');
    }

    if (file.size > AVATAR_MAX_SIZE) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'File size exceeds limit');
    }

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      throw new CustomError(
        AppErrorCode.INVALID_INPUT,
        `Invalid file type. Allowed: ${AVATAR_ALLOWED_TYPES.join(', ')}`,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `users/${userId}/avatar-${Date.now()}`;
    const url = await storageRepository.uploadFile(path, buffer, file.type);

    return { success: true, data: { url } };
  }

  static async deleteFileByUrl(publicUrl: string): Promise<void> {
    if (!publicUrl) return;

    try {
      const path = this.extractPathFromUrl(publicUrl);
      if (path) {
        await storageRepository.deleteFile(path);
      }
    } catch (error) {
      console.warn('Failed to extract path or delete file:', error);
    }
  }

  /**
   * Helper: Extracts the storage path from a public URL.
   */
  private static extractPathFromUrl(url: string): string | null {
    try {
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
  }
}
