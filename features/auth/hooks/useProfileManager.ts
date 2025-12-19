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
      // This ensures the next "getIdToken" call includes the new name/photo
      if (clientAuth.currentUser) {
        await updateProfile(clientAuth.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      // 3. Optimistic Update (Immediate UI feedback)
      updateUser(updates);

      // 4. Server-Side Update (Syncs Firestore)
      const result = await updateProfileAction({
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });

      if (result?.serverError) {
        throw new Error(result.serverError.message || 'Server update failed');
      }

      // 5. Refresh Session Cookie (Critical for Server Components)
      // We force a token refresh to get the new claims (name/picture)
      if (clientAuth.currentUser) {
        const idToken = await clientAuth.currentUser.getIdToken(true);
        await createSessionAction({ idToken });

        // Refresh the Next.js router to update Server Components (like the Header)
        router.refresh();
      }

      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Profile Update Error:', error);
      enqueueSnackbar(error.message || 'Failed to update profile', { variant: 'error' });
      // Revert optimistic update if needed? (Advanced: Implement rollback logic here)
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
