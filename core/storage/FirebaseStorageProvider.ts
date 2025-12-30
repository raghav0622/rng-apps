import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  getMetadata,
} from 'firebase/storage';
import {
  AbstractStorageProvider,
  StorageMetadata,
} from '../abstract-storage-provider/AbstractStorageProvider';
import { clientStorage } from '@/lib/firebase/client';

/**
 * Firebase Storage implementation of AbstractStorageProvider
 * 
 * Provides file upload, download, and management capabilities using Firebase Storage.
 * Enforces tenant isolation through metadata and path structuring.
 * 
 * @example
 * ```ts
 * const storage = new FirebaseStorageProvider();
 * const result = await storage.upload(
 *   'tasks/task-123/submission.pdf',
 *   fileBuffer,
 *   { orgId: 'org-456', uploadedBy: 'user-789', contentType: 'application/pdf' }
 * );
 * console.log(result.url); // Public download URL
 * ```
 */
export class FirebaseStorageProvider extends AbstractStorageProvider {
  private storage = clientStorage;

  /**
   * Uploads a file to Firebase Storage
   * 
   * @param path - Destination path (e.g., "tasks/task-123/file.pdf")
   * @param file - File content as Buffer or Blob
   * @param metadata - Required metadata (orgId, uploadedBy, contentType)
   * @returns Promise with download URL and file ID
   * 
   * @example
   * ```ts
   * const result = await storage.upload(
   *   'tasks/123/report.pdf',
   *   fileBlob,
   *   { orgId: 'org-1', uploadedBy: 'user-1', contentType: 'application/pdf' }
   * );
   * ```
   */
  async upload(
    path: string,
    file: Buffer | Blob,
    metadata: StorageMetadata
  ): Promise<{ url: string; fileId: string }> {
    // Create storage reference with tenant-scoped path
    const fileRef = ref(this.storage, `orgs/${metadata.orgId}/${path}`);

    // Prepare metadata for Firebase
    const uploadMetadata = {
      customMetadata: {
        orgId: metadata.orgId,
        uploadedBy: metadata.uploadedBy,
        uploadedAt: new Date().toISOString(),
      },
      contentType: metadata.contentType,
    };

    // Upload file
    const snapshot = await uploadBytes(fileRef, file, uploadMetadata);

    // Get download URL
    const url = await getDownloadURL(snapshot.ref);

    return {
      url,
      fileId: snapshot.ref.fullPath,
    };
  }

  /**
   * Generates a signed URL for temporary access to private files
   * 
   * Note: Firebase Storage public files don't require signed URLs.
   * For private files, use Firebase Storage Rules and this method.
   * 
   * @param path - File path
   * @param expiresAt - Expiration timestamp in milliseconds
   * @returns Promise with signed URL
   */
  async getSignedUrl(path: string, expiresAt: number): Promise<string> {
    const fileRef = ref(this.storage, path);
    
    // Firebase Storage download URLs are long-lived by default
    // For true signed URLs with expiration, you'd need Cloud Functions
    // For now, return the standard download URL
    const url = await getDownloadURL(fileRef);
    
    // TODO: Implement Cloud Function for true signed URLs with expiration
    return url;
  }

  /**
   * Deletes a file from Firebase Storage
   * 
   * @param path - File path to delete
   * 
   * @example
   * ```ts
   * await storage.delete('orgs/org-1/tasks/123/file.pdf');
   * ```
   */
  async delete(path: string): Promise<void> {
    const fileRef = ref(this.storage, path);
    await deleteObject(fileRef);
  }

  /**
   * Checks if a file exists in Firebase Storage
   * 
   * @param path - File path to check
   * @returns Promise with boolean indicating existence
   * 
   * @example
   * ```ts
   * const exists = await storage.exists('orgs/org-1/tasks/123/file.pdf');
   * ```
   */
  async exists(path: string): Promise<boolean> {
    try {
      const fileRef = ref(this.storage, path);
      await getMetadata(fileRef);
      return true;
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        return false;
      }
      throw error;
    }
  }
}

/**
 * Singleton instance of FirebaseStorageProvider
 * 
 * @example
 * ```ts
 * import { storageProvider } from '@/core/storage/FirebaseStorageProvider';
 * 
 * const result = await storageProvider.upload(...);
 * ```
 */
export const storageProvider = new FirebaseStorageProvider();
