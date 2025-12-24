// core/lib/storage/AbstractStorageProvider.ts
export interface StorageMetadata {
  orgId: string;
  uploadedBy: string;
  contentType?: string;
}

export abstract class AbstractStorageProvider {
  /**
   * Upload a file with mandatory tenancy metadata.
   */
  abstract upload(
    path: string,
    file: Buffer | Blob,
    metadata: StorageMetadata,
  ): Promise<{ url: string; fileId: string }>;

  /**
   * Generate a secure, time-limited URL for private files.
   */
  abstract getSignedUrl(path: string, expiresAt: number): Promise<string>;

  /**
   * Delete a file.
   */
  abstract delete(path: string): Promise<void>;

  /**
   * Verify file existence.
   */
  abstract exists(path: string): Promise<boolean>;
}
