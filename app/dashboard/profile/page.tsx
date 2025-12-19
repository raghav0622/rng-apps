// app/dashboard/profile/page.tsx
'use client';

import {
  createSessionAction,
  deleteAccountAction,
  updateProfileAction,
} from '@/features/auth/auth.actions';
import { useAuth } from '@/features/auth/components/AuthContext';
import { uploadAvatarAction } from '@/features/storage/storage.actions'; // New Import
import { clientAuth } from '@/lib/firebase/client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Alert, Box, Button, Card, CardContent, CardHeader, Skeleton, Stack } from '@mui/material';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { z } from 'zod';

// Lazy Load Modals
const ChangePasswordModal = dynamic(
  () =>
    import('@/features/auth/components/ChangePasswordModal').then((mod) => mod.ChangePasswordModal),
  { loading: () => null },
);

const ConfirmPasswordModal = dynamic(
  () =>
    import('@/features/auth/components/ConfirmPasswordModal').then(
      (mod) => mod.ConfirmPasswordModal,
    ),
  { loading: () => null },
);

const ProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  photoURL: z.union([z.string(), z.any()]).optional(),
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

  if (!user) {
    return (
      <Stack spacing={4}>
        <Card>
          <Skeleton variant="rectangular" height={300} />
        </Card>
        <Card>
          <Skeleton variant="rectangular" height={150} />
        </Card>
      </Stack>
    );
  }

  const handleUpdateProfile = async (values: z.infer<typeof ProfileSchema>) => {
    let finalPhotoURL = typeof values.photoURL === 'string' ? values.photoURL : user.photoURL;

    try {
      // 1. Upload via Server Action if a file was selected
      if (values.photoURL instanceof File) {
        const formData = new FormData();
        formData.append('file', values.photoURL);

        const uploadResult = await uploadAvatarAction(formData);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }

        finalPhotoURL = uploadResult.url || null;
      }

      // 2. Call Server Action to update Firestore & Auth User
      await updateProfileAction({
        displayName: values.displayName,
        photoURL: typeof finalPhotoURL === 'string' ? finalPhotoURL : undefined,
      });

      // 3. OPTIMISTIC UPDATE
      updateUser({
        displayName: values.displayName,
        photoURL: finalPhotoURL as string | null,
      });

      // 4. Refresh Session Cookie
      if (clientAuth.currentUser) {
        const idToken = await clientAuth.currentUser.getIdToken(true);
        await createSessionAction({ idToken });
        router.refresh();
      }

      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      enqueueSnackbar(error.message || 'Something went wrong', { variant: 'error' });
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
              photoURL: user.photoURL || '',
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
            await deleteAccountAction();
          }}
        />
      )}
    </Stack>
  );
}
