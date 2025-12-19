// features/storage/storage.utils.ts

/**
 * Extracts the storage path from a Firebase Storage public URL.
 * Supports:
 * 1. Firebase Storage format: .../b/{bucket}/o/{path}?alt=media
 * 2. Google Cloud Storage format: .../storage.googleapis.com/{bucket}/{path}
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const decodedUrl = decodeURIComponent(url);

    // Pattern 1: Firebase Storage (contains /o/)
    // Example: https://firebasestorage.googleapis.com/v0/b/bucket/o/users%2F123%2Favatar.jpg?alt=media
    if (decodedUrl.includes('/o/')) {
      const parts = decodedUrl.split('/o/');
      if (parts.length < 2) return null;

      // The path is after /o/ and before any query params
      const pathWithParams = parts[1];
      return pathWithParams.split('?')[0];
    }

    // Pattern 2: Google Cloud Storage (standard public URL)
    // Example: https://storage.googleapis.com/bucket-name/users/123/avatar.jpg
    if (decodedUrl.includes('storage.googleapis.com')) {
      const parts = decodedUrl.split('storage.googleapis.com/');
      if (parts.length < 2) return null;

      // The part after the domain is bucket/path
      // We generally want just the path inside the bucket, but the bucket name is technically part of the URL path here.
      // However, the Admin SDK bucket.file(path) expects the path relative to the bucket root.
      const bucketAndPath = parts[1];
      const firstSlashIndex = bucketAndPath.indexOf('/');

      if (firstSlashIndex === -1) return null;
      return bucketAndPath.substring(firstSlashIndex + 1);
    }

    return null;
  } catch (error) {
    console.error('Failed to parse storage URL', error);
    return null;
  }
}
