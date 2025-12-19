import { createSessionAction, updateProfileAction } from '@/features/auth/auth.actions';
import { act, renderHook } from '@testing-library/react';
import { updateProfile } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfileManager } from './useProfileManager';

// --- MOCKS ---

// 1. Safe Mock Hoisting for Snackbar
// We define the spies here so they are available to the factory below
const mocks = vi.hoisted(() => ({
  enqueueSnackbar: vi.fn(),
  closeSnackbar: vi.fn(),
}));

// Mock the module using the hoisted spies
vi.mock('notistack', () => ({
  useSnackbar: () => mocks,
}));

// 2. Mock Auth Context
const mockUpdateUser = vi.fn();
vi.mock('@/features/auth/components/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: '123', displayName: 'Old Name', photoURL: null },
    updateUser: mockUpdateUser,
  }),
}));

// 3. Mock Server Actions
vi.mock('@/features/auth/auth.actions', () => ({
  updateProfileAction: vi.fn(),
  createSessionAction: vi.fn(),
}));

// 4. Mock Firebase Client & SDK
vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock('@/lib/firebase/client', () => ({
  clientAuth: {
    currentUser: {
      uid: '123',
      getIdToken: vi.fn().mockResolvedValue('new-token'),
    },
  },
}));

// 5. Mock Storage Actions
vi.mock('@/features/storage/storage.actions', () => ({
  uploadAvatarAction: vi.fn(),
}));

describe('useProfileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update profile successfully and refresh session', async () => {
    // Setup Success Mocks
    vi.mocked(updateProfileAction).mockResolvedValue({ data: undefined, serverError: null } as any);
    vi.mocked(createSessionAction).mockResolvedValue({ data: { success: true } } as any);
    vi.mocked(updateProfile).mockResolvedValue(undefined);

    const { result } = renderHook(() => useProfileManager());

    await act(async () => {
      await result.current.updateProfileData({
        displayName: 'New Name',
        photoURL: 'http://new.jpg',
      });
    });

    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('success'),
      expect.objectContaining({ variant: 'success' }),
    );
  });

  it('should RE-THROW error when server action fails', async () => {
    // Setup Failure Mocks
    vi.mocked(updateProfileAction).mockResolvedValue({
      data: null,
      serverError: { message: 'Database crashed' },
    } as any);
    vi.mocked(updateProfile).mockResolvedValue(undefined);

    const { result } = renderHook(() => useProfileManager());

    // 1. Verify the promise rejects (requires 'throw error' in the hook)
    await expect(
      act(async () => {
        await result.current.updateProfileData({ displayName: 'Fail Name' });
      }),
    ).rejects.toThrow('Database crashed');

    // 2. Verify error snackbar was shown using the hoisted spy
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
      'Database crashed',
      expect.objectContaining({ variant: 'error' }),
    );
  });
});
