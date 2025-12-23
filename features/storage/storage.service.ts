import { AppErrorCode, CustomError } from '@/lib/errors';
import { storage } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import 'server-only';
import { AVATAR_ALLOWED_TYPES } from './storage.config';
import { storageRepository } from './storage.repository';

export class StorageService {
  /**
   * Generates a signed URL for direct client-side upload.
   * Solves the bottleneck of passing files through the Next.js server.
   */
  static async getPresignedAvatarUrl(
    userId: string,
    fileType: string,
    fileSize: number,
  ): Promise<Result<{ uploadUrl: string; destinationPath: string }>> {
    try {
      if (!AVATAR_ALLOWED_TYPES.includes(fileType)) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid file type');
      }

      const destinationPath = `users/${userId}/avatar-${Date.now()}`;
      const bucket = storage().bucket();
      const file = bucket.file(destinationPath);

      // Generate Signed URL
      const [uploadUrl] = await file.getSignedUrl({
        action: 'write',
        expires: Date.now() + 5 * 60 * 1000, // 5 minutes
        contentType: fileType,
      });

      return { success: true, data: { uploadUrl, destinationPath } };
    } catch (error) {
      console.error('Presigned URL Error:', error);
      throw new CustomError(AppErrorCode.UNKNOWN_ERROR, 'Failed to generate upload URL');
    }
  }

  // Kept for backward compatibility or small files, but improved return type
  static async uploadAvatar(
    userId: string,
    input: FormData | File,
  ): Promise<Result<{ url: string; path: string }>> {
    let file: File | null = null;

    if (input instanceof FormData) {
      file = input.get('file') as File;
    } else if (input instanceof File) {
      file = input;
    }

    if (!file) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'No file provided');
    }

    // Note: This method still runs on the server. Prefer getPresignedAvatarUrl for large files.
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `users/${userId}/avatar-${Date.now()}`;
    const url = await storageRepository.uploadFile(path, buffer, file.type);

    return { success: true, data: { url, path } };
  }

  /**
   * Robust deletion using the explicit storage path.
   */
  static async deleteFileByPath(path: string): Promise<void> {
    if (!path) return;
    try {
      await storageRepository.deleteFile(path);
    } catch (error) {
      console.warn(`Failed to delete file at ${path}:`, error);
    }
  }

  // Deprecated: Kept for legacy support
  static async deleteFileByUrl(publicUrl: string): Promise<void> {
    if (!publicUrl) return;
    const path = this.extractPathFromUrl(publicUrl);
    if (path) await this.deleteFileByPath(path);
  }

  private static extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'storage.googleapis.com') {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length > 2) return decodeURIComponent(pathParts.slice(2).join('/'));
      }
      if (urlObj.hostname === 'firebasestorage.googleapis.com') {
        const pathStartIndex = urlObj.pathname.indexOf('/o/');
        if (pathStartIndex !== -1)
          return decodeURIComponent(urlObj.pathname.substring(pathStartIndex + 3));
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
