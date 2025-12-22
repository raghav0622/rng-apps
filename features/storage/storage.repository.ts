// features/storage/storage.repository.ts
import { AppErrorCode, CustomError } from '@/lib/errors';
import { storage } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/logger';
import 'server-only';

export class StorageRepository {
  // Lazy getter to ensure admin is initialized before accessing bucket
  private get bucket() {
    return storage().bucket();
  }

  /**
   * Uploads a buffer to Firebase Storage and makes it public.
   * NOTE: If your bucket has "Uniform Bucket Level Access" enabled,
   * 'public: true' will be ignored. You may need to use signed URLs or Firebase Download URLs.
   */
  async uploadFile(path: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      const file = this.bucket.file(path);

      await file.save(buffer, {
        metadata: {
          contentType,
          // Cache Control: Public, max-age=1 year (standard for immutable avatars)
          cacheControl: 'public, max-age=31536000',
        },
        public: true,
      });

      return file.publicUrl();
    } catch (error) {
      logError('Storage Upload Failed', { path, error });
      throw new CustomError(AppErrorCode.UNKNOWN, 'Failed to upload file');
    }
  }

  /**
   * Deletes a file from storage.
   * Silently ignores "Not Found" errors to keep operations idempotent.
   */
  async deleteFile(path: string): Promise<void> {
    if (!path) return;

    try {
      await this.bucket.file(path).delete();
      logInfo(`🗑️ Deleted old file: ${path}`);
    } catch (error: any) {
      if (error.code === 404) return;
      logError('Storage Delete Warning', { path, error });
    }
  }
}

export const storageRepository = new StorageRepository();
