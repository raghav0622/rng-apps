'use client';

import { uploadAvatarAction } from '@/features/storage/storage.actions';
import { AppErrorCode } from '@/lib/errors';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { deleteAccountAction, updateUserAction } from '../actions/profile.actions';
import { ProfileInput } from '../auth.model';

export function useProfile() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // --- 1. Helper Action: Upload ---
  const { runAction: uploadAvatar } = useRNGServerAction(uploadAvatarAction);

  // --- 2. Main Action: Update User ---
  const { runAction: updateProfile, isExecuting: isUpdating } = useRNGServerAction(
    //@ts-expect-error ads
    updateUserAction, // Note: Ensure the action input schema matches { displayName, photoUrl }
    {
      onSuccess: () => {
        enqueueSnackbar('Profile updated successfully', { variant: 'success' });
        router.refresh();
      },
      onError: (msg, code) => {
        if (code === AppErrorCode.UNAUTHENTICATED) {
          enqueueSnackbar('Session expired. Redirecting...', { variant: 'warning' });
          router.push('/login?reason=session_expired');
        } else {
          enqueueSnackbar(msg || 'Failed to update profile', { variant: 'error' });
        }
      },
    },
  );

  // --- 3. Main Action: Delete Account ---
  const { runAction: deleteAccount, isExecuting: isDeleting } = useRNGServerAction(
    deleteAccountAction,
    {
      onSuccess: () => {
        enqueueSnackbar('Account deleted successfully', { variant: 'success' });
        // Hard reload to clear all client states/cache
        window.location.href = '/login';
      },
      onError: (msg) => {
        enqueueSnackbar(msg || 'Failed to delete account', { variant: 'error' });
      },
    },
  );

  /**
   * Orchestrates the upload and update process
   */
  const handleUpdateProfile = async (data: ProfileInput, currentphotoUrl?: string | null) => {
    try {
      let finalphotoUrl: string = '';

      // Case A: New File Upload
      if (data.photoUrl instanceof File) {
        const res = await uploadAvatar({ file: data.photoUrl });
        if (!res?.url) throw new Error('Image upload failed');
        finalphotoUrl = res.url;
      }
      // Case B: Explicit Removal (null or empty string)
      else if (!data.photoUrl || data.photoUrl === null || data.photoUrl === '') {
        finalphotoUrl = '';
      }
      // Case C: No Change (string match)
      else if (typeof data.photoUrl === 'string') {
        // If it matches current, send undefined so backend ignores it
        finalphotoUrl = data.photoUrl === currentphotoUrl ? '' : data.photoUrl;
      }

      await updateProfile({
        displayName: data.displayName,
        photoUrl: finalphotoUrl,
      });
    } catch (error: any) {
      console.error(error);
      enqueueSnackbar(error.message || 'An unexpected error occurred', { variant: 'error' });
    }
  };

  return {
    handleUpdateProfile,
    deleteAccount,
    isUpdating,
    isDeleting,
  };
}
