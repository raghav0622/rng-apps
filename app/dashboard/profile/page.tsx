'use client';

import {
  createSessionAction,
  deleteAccountAction,
  updateProfileAction,
} from '@/features/auth/auth.actions';
import { useAuth } from '@/features/auth/components/AuthContext';
import { ChangePasswordModal } from '@/features/auth/components/ChangePasswordModal';
import { ConfirmPasswordModal } from '@/features/auth/components/ConfirmPasswordModal';
import { clientAuth, clientStorage } from '@/lib/firebase/client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Alert, Box, Button, Card, CardContent, CardHeader, Stack } from '@mui/material';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { z } from 'zod';

const ProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  photoURL: z.union([z.string(), z.any()]).optional(),
});

const profileFormConfig = defineForm<typeof ProfileSchema>((f) => [
  f.text('displayName', { label: 'Name' }),
  f.avatar('photoURL', { label: 'Profile Picture' }),
]);

export default function ProfilePage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  if (!user) return null;

  const handleUpdateProfile = async (values: z.infer<typeof ProfileSchema>) => {
    // Default to existing URL
    let finalPhotoURL = typeof values.photoURL === 'string' ? values.photoURL : user.photoURL;

    try {
      // 1. Upload new image to Storage if a file was selected
      if (values.photoURL instanceof File) {
        const file = values.photoURL;
        // Path: users/{uid}/avatar
        const storageRef = ref(clientStorage, `users/${user.uid}/avatar`);

        const snapshot = await uploadBytes(storageRef, file);
        finalPhotoURL = await getDownloadURL(snapshot.ref);
      }

      // 2. Call Server Action to update Firestore & Auth User
      await updateProfileAction({
        displayName: values.displayName,
        photoURL: typeof finalPhotoURL === 'string' ? finalPhotoURL : undefined,
      });

      // 3. Refresh Session Cookie
      // Since we updated the Auth User on the server, we need a new token
      // with the updated claims (name, picture) to write a new cookie.
      if (clientAuth.currentUser) {
        // Force refresh token to get new claims
        const idToken = await clientAuth.currentUser.getIdToken(true);
        // Exchange new token for new session cookie
        await createSessionAction({ idToken });
      }

      // 4. Update UI Context
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

      <ChangePasswordModal open={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} />

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
    </Stack>
  );
}
