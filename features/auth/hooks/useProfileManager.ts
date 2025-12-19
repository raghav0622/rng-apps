import { createSessionAction, updateProfileAction } from '@/features/auth/auth.actions';
import { useAuth } from '@/features/auth/components/AuthContext';
import { uploadAvatarAction } from '@/features/storage/storage.actions';
import { clientAuth } from '@/lib/firebase/client';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

interface UpdateProfileParams {
  displayName: string;
  photoURL?: File | string | null;
}

export function useProfileManager() {
  const { user, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfileData = async (values: UpdateProfileParams) => {
    if (!user) return;
    setIsUpdating(true);

    try {
      let finalPhotoURL: string | null = user.photoURL || null;

      // 1. Handle File Upload (if changed)
      if (values.photoURL instanceof File) {
        const formData = new FormData();
        formData.append('file', values.photoURL);

        const uploadResult = await uploadAvatarAction(formData);
        if (!uploadResult?.data?.url) {
          throw new Error('Failed to upload profile picture.');
        }
        finalPhotoURL = uploadResult.data.url;
      } else if (values.photoURL === null) {
        finalPhotoURL = null;
      } else if (typeof values.photoURL === 'string') {
        finalPhotoURL = values.photoURL;
      }

      const updates = {
        displayName: values.displayName,
        photoURL: finalPhotoURL,
      };

      // 2. Client-Side Update (Firebase SDK)
      if (clientAuth.currentUser) {
        await updateProfile(clientAuth.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      // 3. Optimistic Update
      updateUser(updates);

      // 4. Server-Side Update
      const result = await updateProfileAction({
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });

      if (result?.serverError) {
        throw new Error(result.serverError.message || 'Server update failed');
      }

      // 5. Refresh Session Cookie
      if (clientAuth.currentUser) {
        const idToken = await clientAuth.currentUser.getIdToken(true);
        await createSessionAction({ idToken });
        router.refresh();
      }

      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Profile Update Error:', error);
      enqueueSnackbar(error.message || 'Failed to update profile', { variant: 'error' });
      // FIX: Re-throw the error so the calling component knows the request failed
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    user,
    updateProfileData,
    isUpdating,
  };
}
