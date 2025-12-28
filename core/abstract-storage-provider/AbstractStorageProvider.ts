// core/lib/storage/AbstractStorageProvider.ts
export interface StorageMetadata {
  orgId: string;
  uploadedBy: string;
  contentType?: string;
}

/**
 * Abstraction for File Storage Services (AWS S3, Google Cloud Storage, Firebase Storage).
 * Enforces metadata requirements for tenancy and security.
 */
export abstract class AbstractStorageProvider {
  /**
   * Uploads a file to the storage provider.
   *
   * @param {string} path - The destination path/key (e.g., "avatars/user-123.png").
   * @param {Buffer | Blob} file - The file content.
   * @param {StorageMetadata} metadata - Mandatory metadata for access control (orgId).
   * @returns {Promise<{ url: string; fileId: string }>} The public/download URL and unique file ID.
   */
  abstract upload(
    path: string,
    file: Buffer | Blob,
    metadata: StorageMetadata,
  ): Promise<{ url: string; fileId: string }>;

  /**
   * Generates a temporary, secure URL for accessing private files.
   *
   * @param {string} path - The file path/key.
   * @param {number} expiresAt - The timestamp (ms) when the link should expire.
   * @returns {Promise<string>} A signed URL.
   */
  abstract getSignedUrl(path: string, expiresAt: number): Promise<string>;

  /**
   * Permanently deletes a file.
   *
   * @param {string} path - The file path/key.
   */
  abstract delete(path: string): Promise<void>;

  /**
   * Checks if a file exists at the given path.
   *
   * @param {string} path - The file path/key.
   * @returns {Promise<boolean>} True if the file exists.
   */
  abstract exists(path: string): Promise<boolean>;
}
