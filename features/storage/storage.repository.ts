// features/storage/storage.repository.ts
import { AppErrorCode, CustomError } from '@/lib/errors';
import { storage } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/logger';
import 'server-only';

export const storageRepository = {
  /**
   * Uploads a buffer to Firebase Storage and makes it public.
   */
  async uploadFile(path: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      const bucket = storage().bucket();
      const file = bucket.file(path);

      await file.save(buffer, {
        metadata: {
          contentType,
        },
        public: true,
      });

      return file.publicUrl();
    } catch (error) {
      logError('Storage Upload Failed', { path, error });
      throw new CustomError(AppErrorCode.UNKNOWN, 'Failed to upload file');
    }
  },

  /**
   * Deletes a file from storage.
   * Silently ignores "Not Found" errors to keep operations idempotent.
   */
  async deleteFile(path: string): Promise<void> {
    if (!path) return;

    try {
      const bucket = storage().bucket();
      await bucket.file(path).delete();
      logInfo(`🗑️ Deleted old file: ${path}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Ignore 404 Not Found errors
      if (error.code === 404) {
        return;
      }
      // Log other errors but don't crash the request
      logError('Storage Delete Warning', { path, error });
    }
  },
};
