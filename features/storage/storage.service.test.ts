import { AppErrorCode } from '@/lib/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageRepository } from './storage.repository';
import { StorageService } from './storage.service';

// Mock the repository layer
vi.mock('./storage.repository', () => ({
  storageRepository: {
    uploadFile: vi.fn(),
  },
}));

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadAvatar', () => {
    // Helper to create a fake File object with arrayBuffer support
    const createFile = (size: number, type: string) => {
      const blob = new Blob(['a'.repeat(size)], { type });
      const file = new File([blob], 'test.jpg', { type });

      // Patch arrayBuffer for JSDOM
      Object.defineProperty(file, 'arrayBuffer', {
        value: async () => new ArrayBuffer(size),
        writable: true,
      });

      return file;
    };

    it('should upload valid image files', async () => {
      const file = createFile(1024, 'image/jpeg'); // 1KB JPEG
      const formData = new FormData();
      formData.append('file', file);

      vi.mocked(storageRepository.uploadFile).mockResolvedValue('https://url.com/img.jpg');

      const result = await StorageService.uploadAvatar('user-123', formData);

      expect(result).toBe('https://url.com/img.jpg');
      expect(storageRepository.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining('users/user-123/avatar-'),
        expect.any(Buffer),
        'image/jpeg',
      );
    });

    it('should throw error if file is too large (>5MB)', async () => {
      const largeFile = createFile(6 * 1024 * 1024, 'image/png'); // 6MB
      const formData = new FormData();
      formData.append('file', largeFile);

      await expect(StorageService.uploadAvatar('user-123', formData)).rejects.toThrow(
        expect.objectContaining({
          code: AppErrorCode.INVALID_INPUT,
          message: expect.stringContaining('limit'),
        }),
      );
    });

    it('should throw error for unsupported file types (e.g. PDF)', async () => {
      const pdfFile = createFile(100, 'application/pdf');
      const formData = new FormData();
      formData.append('file', pdfFile);

      await expect(StorageService.uploadAvatar('user-123', formData)).rejects.toThrow(
        expect.objectContaining({
          code: AppErrorCode.INVALID_INPUT,
          message: expect.stringContaining('Invalid file type'),
        }),
      );
    });
  });
});
