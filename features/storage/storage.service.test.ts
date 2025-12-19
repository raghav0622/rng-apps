import { AppErrorCode } from '@/lib/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageRepository } from './storage.repository';
import { StorageService } from './storage.service';

// Mock the repository to avoid actual network calls
vi.mock('./storage.repository', () => ({
  storageRepository: {
    uploadFile: vi.fn(),
  },
}));

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to simulate a File object with arrayBuffer support
  const createFile = (size: number, type: string) => {
    const blob = new Blob(['a'.repeat(size)], { type });
    // JSDOM's File implementation might lack arrayBuffer, so we attach it explicitly
    const file = new File([blob], 'test-image.jpg', { type });

    file.arrayBuffer = async () => {
      return new ArrayBuffer(size);
    };

    return file;
  };

  describe('uploadAvatar', () => {
    it('should successfully upload a valid image File', async () => {
      const file = createFile(1024, 'image/jpeg'); // 1KB JPEG
      vi.mocked(storageRepository.uploadFile).mockResolvedValue('https://storage.com/avatar.jpg');

      const result = await StorageService.uploadAvatar('user-123', file);

      expect(result).toBe('https://storage.com/avatar.jpg');
      expect(storageRepository.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining('users/user-123/avatar-'),
        expect.any(Buffer),
        'image/jpeg',
      );
    });

    it('should throw error if file is too large (>5MB)', async () => {
      const largeFile = createFile(6 * 1024 * 1024, 'image/png'); // 6MB

      await expect(StorageService.uploadAvatar('user-123', largeFile)).rejects.toThrow(
        expect.objectContaining({
          code: AppErrorCode.INVALID_INPUT,
          message: expect.stringContaining('limit'),
        }),
      );
    });

    it('should throw error for unsupported file types (e.g., PDF)', async () => {
      const pdfFile = createFile(1024, 'application/pdf');

      await expect(StorageService.uploadAvatar('user-123', pdfFile)).rejects.toThrow(
        expect.objectContaining({
          code: AppErrorCode.INVALID_INPUT,
          message: expect.stringContaining('Invalid file type'),
        }),
      );
    });

    it('should support FormData input for backward compatibility', async () => {
      const file = createFile(1024, 'image/png');
      const formData = new FormData();
      formData.append('file', file);

      vi.mocked(storageRepository.uploadFile).mockResolvedValue('https://storage.com/compat.png');

      const result = await StorageService.uploadAvatar('user-123', formData);

      expect(result).toBe('https://storage.com/compat.png');
    });
  });
});
