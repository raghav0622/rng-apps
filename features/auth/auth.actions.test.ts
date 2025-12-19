import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionAction, deleteAccountAction, updateProfileAction } from './auth.actions';
import { AuthService } from './auth.service';

// 1. Mock the Service Layer
vi.mock('./auth.service', () => ({
  AuthService: {
    createSession: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
    logout: vi.fn(),
  },
}));

// 2. Mock 'next-safe-action' Middleware
vi.mock('@/lib/safe-action', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/safe-action')>();
  return {
    ...actual,
    authActionClient: actual.actionClient.use(async ({ next }) => {
      // Simulate a successfully authenticated user
      return next({ ctx: { userId: 'test-user-uid', email: 'test@example.com' } });
    }),
  };
});

describe('Auth Actions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createSessionAction', () => {
    it('should call AuthService.createSession with valid inputs', async () => {
      vi.mocked(AuthService.createSession).mockResolvedValue({ success: true, data: undefined });

      const result = await createSessionAction({
        idToken: 'valid-firebase-token',
        fullName: 'Test User',
      });

      expect(AuthService.createSession).toHaveBeenCalledWith('valid-firebase-token', 'Test User');
      expect(result.data?.success).toBe(true);
    });
  });

  describe('updateProfileAction', () => {
    it('should inject userId from context and call AuthService', async () => {
      vi.mocked(AuthService.updateProfile).mockResolvedValue({ success: true, data: undefined });

      const input = { displayName: 'Updated Name', photoURL: 'http://pic.com/1.jpg' };

      const result = await updateProfileAction(input);

      expect(AuthService.updateProfile).toHaveBeenCalledWith('test-user-uid', input);
      expect(result.data?.success).toBe(true);
    });
  });

  describe('deleteAccountAction', () => {
    it('should trigger account deletion for the current user', async () => {
      vi.mocked(AuthService.deleteAccount).mockResolvedValue({ success: true, data: undefined });

      const result = await deleteAccountAction();

      expect(AuthService.deleteAccount).toHaveBeenCalledWith('test-user-uid');
      expect(result.data?.success).toBe(true);
    });
  });
});
