import { beforeEach, describe, expect, it, vi } from 'vitest';
// 1. Mock firebase/admin BEFORE imports to prevent initialization side-effects
vi.mock('@/lib/firebase/admin', () => ({
  auth: () => ({
    verifyIdToken: vi.fn(),
    createSessionCookie: vi.fn(),
  }),
  firestore: () => ({
    collection: () => ({
      doc: () => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
      }),
    }),
  }),
}));

import { AppErrorCode } from '@/lib/errors';
import { cookies } from 'next/headers';
import { authRepository } from './auth.repository';
import { AuthService } from './auth.service';

// Mock dependencies
vi.mock('./auth.repository');
vi.mock('@/features/storage/storage.repository', () => ({
  storageRepository: {
    deleteFile: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session cookie and sync user data', async () => {
      // Setup Mocks
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'http://pic.com/1.jpg',
      };

      vi.mocked(authRepository.verifyIdToken).mockResolvedValue(mockUser as any);
      vi.mocked(authRepository.createSessionCookie).mockResolvedValue('session-cookie-123');

      const cookieStore = { set: vi.fn() };
      // @ts-ignore
      vi.mocked(cookies).mockResolvedValue(cookieStore);

      // Execute
      const result = await AuthService.createSession('valid-id-token', 'Test User');

      // Assert
      expect(result.success).toBe(true);

      expect(authRepository.ensureUserExists).toHaveBeenCalledWith(
        'user-123',
        {
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'http://pic.com/1.jpg',
        },
        expect.objectContaining({
          displayName: 'Test User',
        }),
      );

      expect(cookieStore.set).toHaveBeenCalledWith(
        'auth_session_token',
        'session-cookie-123',
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('should throw validation error if email is missing', async () => {
      vi.mocked(authRepository.verifyIdToken).mockResolvedValue({ uid: '123' } as any);

      await expect(AuthService.createSession('token')).rejects.toThrow(
        expect.objectContaining({ code: AppErrorCode.VALIDATION_ERROR }),
      );
    });
  });
});
