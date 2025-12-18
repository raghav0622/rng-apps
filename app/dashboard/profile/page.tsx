'use client';

import { deleteAccountAction, updateProfileAction } from '@/features/auth/auth.actions';
import { useAuth } from '@/lib/auth/AuthContext';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { ChangePasswordModal } from '@/ui/modals/ChangePasswordModal';
import { ConfirmPasswordModal } from '@/ui/modals/ConfirmPasswordModal';
import { Alert, Box, Button, Card, CardContent, CardHeader, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { z } from 'zod';

// Helper to convert file to base64
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

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

  return (
    <Stack spacing={4}>
      <Card>
        <CardHeader title="User Profile" subheader="Manage your personal information" />
        <CardContent>
          <RNGForm
            schema={ProfileSchema}
            uiSchema={profileFormConfig}
            defaultValues={{
              displayName: user.displayName,
              photoURL: user.photoURL || '',
            }}
            onSubmit={async (values) => {
              let finalPhotoURL = values.photoURL;
              if (values.photoURL instanceof File) {
                try {
                  finalPhotoURL = await toBase64(values.photoURL);
                } catch (error) {
                  enqueueSnackbar('Failed to process image', { variant: 'error' });
                  return;
                }
              }

              const result = await updateProfileAction({
                displayName: values.displayName,
                photoURL: typeof finalPhotoURL === 'string' ? finalPhotoURL : undefined,
              });

              if (result?.data?.success) {
                enqueueSnackbar('Profile updated successfully', { variant: 'success' });
                window.location.reload();
              } else {
                const errorMsg =
                  result?.data?.success === false ? result.data.error.message : 'Failed to update';
                enqueueSnackbar(errorMsg, { variant: 'error' });
              }
            }}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>

      {/* Security Section */}
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

      {/* Modals */}
      <ChangePasswordModal open={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} />

      <ConfirmPasswordModal
        open={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account?"
        description="This action cannot be undone. Please enter your password to confirm."
        confirmLabel="Delete Permanently"
        onConfirm={async () => {
          // Trigger server action to delete account
          await deleteAccountAction();
        }}
      />
    </Stack>
  );
}
