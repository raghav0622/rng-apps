// app/dashboard/profile/page.tsx
'use client';

import {
  createSessionAction,
  deleteAccountAction,
  updateProfileAction,
} from '@/features/auth/auth.actions';
import { useAuth } from '@/features/auth/components/AuthContext';
import { uploadAvatarAction } from '@/features/storage/storage.actions';
import { clientAuth } from '@/lib/firebase/client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Alert, Box, Button, Card, CardContent, CardHeader, Stack } from '@mui/material';
import { updateProfile } from 'firebase/auth';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { z } from 'zod';

const ChangePasswordModal = dynamic(
  () =>
    import('@/features/auth/components/ChangePasswordModal').then((mod) => mod.ChangePasswordModal),
  { ssr: false },
);

const ConfirmPasswordModal = dynamic(
  () =>
    import('@/features/auth/components/ConfirmPasswordModal').then(
      (mod) => mod.ConfirmPasswordModal,
    ),
  { ssr: false },
);

const ProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  photoURL: z.union([z.string(), z.any()]).nullable().optional(),
});

const profileFormConfig = defineForm<typeof ProfileSchema>((f) => [
  f.text('displayName', { label: 'Name' }),
  f.avatar('photoURL', { label: 'Profile Picture' }),
]);

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  if (!user) return null;

  const handleUpdateProfile = async (values: z.infer<typeof ProfileSchema>) => {
    let finalPhotoURL: string | null = user.photoURL || null;

    try {
      // 1. Handle File Upload or Deletion
      if (values.photoURL instanceof File) {
        const formData = new FormData();
        formData.append('file', values.photoURL);
        const uploadResult = await uploadAvatarAction(formData);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Avatar upload failed');
        }
        finalPhotoURL = uploadResult.url || null;
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
        // Safe check: handle if serverError is a string or an object
        const message =
          typeof result.serverError === 'string'
            ? result.serverError
            : result.serverError?.message || 'Failed to update profile on server';
        throw new Error(message);
      }

      // 5. Refresh Session
      if (clientAuth.currentUser) {
        const idToken = await clientAuth.currentUser.getIdToken(true);
        await createSessionAction({ idToken });
        router.refresh();
      }

      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    } catch (error: any) {
      console.error(error);
      enqueueSnackbar(error.message || 'Something went wrong', { variant: 'error' });
      router.refresh();
    }
  };

  return (
    <Stack spacing={4}>
      <Card>
        <CardHeader title="User Profile" subheader="Manage your personal information" />
        <CardContent>
          <RNGForm
            schema={ProfileSchema}
            uiSchema={profileFormConfig}
            defaultValues={{
              displayName: user.displayName || '',
              photoURL: user.photoURL || null,
            }}
            onSubmit={handleUpdateProfile}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Security" subheader="Password and Account Settings" />
        <CardContent>
          <Stack spacing={2} direction="row" alignItems="center">
            <Button variant="outlined" onClick={() => setPasswordModalOpen(true)}>
              Change Password
            </Button>
            <Box flexGrow={1} />
            <Button variant="contained" color="error" onClick={() => setDeleteModalOpen(true)}>
              Delete Account
            </Button>
          </Stack>
          <Alert severity="warning" sx={{ mt: 3 }}>
            Deleting your account is permanent. All your personal data will be removed.
          </Alert>
        </CardContent>
      </Card>

      {isPasswordModalOpen && (
        <ChangePasswordModal
          open={isPasswordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmPasswordModal
          open={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Account?"
          description="This action cannot be undone. Please enter your password to confirm."
          confirmLabel="Delete Permanently"
          onConfirm={async () => {
            const res = await deleteAccountAction();

            if (res?.serverError) {
              // FIX: Access .message property since serverError is an AppError object
              throw new Error(res.serverError.message || 'Failed to delete account');
            }

            // Redirect client-side to avoid "NEXT_REDIRECT" error inside try/catch
            router.push('/login');
          }}
        />
      )}
    </Stack>
  );
}
