/**
 * File Upload Utility for Firebase Storage
 * Handles file uploads, validation, and URL generation
 * 
 * @module lib/utils/file-upload
 */

import { TaskAttachment } from '@/app-features/tasks/task.model';

/**
 * Supported file types and their MIME types
 */
export const SUPPORTED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  
  // Text
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Image file types
 */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validates a file before upload
 * 
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 * 
 * @example
 * ```ts
 * const result = validateFile(file);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file type
  const supportedTypes = Object.keys(SUPPORTED_FILE_TYPES);
  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload images, PDFs, or documents.',
    };
  }

  return { valid: true };
}

/**
 * Checks if a file is an image
 * 
 * @param fileType - MIME type of the file
 * @returns True if the file is an image
 */
export function isImageFile(fileType: string): boolean {
  return IMAGE_TYPES.includes(fileType);
}

/**
 * Generates a unique filename for storage
 * 
 * @param originalName - Original file name
 * @param userId - User ID uploading the file
 * @returns Unique filename with timestamp
 * 
 * @example
 * ```ts
 * const filename = generateUniqueFilename('report.pdf', 'user-123');
 * // Returns: 'user-123/1234567890-report.pdf'
 * ```
 */
export function generateUniqueFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}-${sanitizedName}`;
}

/**
 * Formats file size in human-readable format
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 * 
 * @example
 * ```ts
 * formatFileSize(2500000); // Returns "2.38 MB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Creates a TaskAttachment object from uploaded file metadata
 * 
 * @param fileData - File upload result data
 * @param userId - User ID who uploaded the file
 * @returns TaskAttachment object
 */
export function createAttachmentFromUpload(
  fileData: {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    thumbnailUrl?: string;
  },
  userId: string
): TaskAttachment {
  return {
    id: fileData.id,
    fileName: fileData.fileName,
    fileSize: fileData.fileSize,
    fileType: fileData.fileType,
    fileUrl: fileData.fileUrl,
    uploadedBy: userId,
    uploadedAt: new Date(),
    isImage: isImageFile(fileData.fileType),
    thumbnailUrl: fileData.thumbnailUrl,
  };
}

/**
 * Gets file extension from filename
 * 
 * @param filename - Name of the file
 * @returns File extension (e.g., "pdf", "jpg")
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Gets icon name for file type (for UI display)
 * 
 * @param fileType - MIME type of the file
 * @returns Icon identifier string
 */
export function getFileTypeIcon(fileType: string): string {
  if (isImageFile(fileType)) return 'image';
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType.includes('word')) return 'document';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'spreadsheet';
  if (fileType.includes('text')) return 'text';
  return 'file';
}
