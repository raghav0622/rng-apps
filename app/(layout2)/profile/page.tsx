'use client';
import { deleteAccountAction, updateUserAction } from '@/features/auth/auth.actions';
import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { uploadAvatarAction } from '@/features/storage/storage.actions';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Alert, Box, Button, Card, CardContent, CardHeader, Stack } from '@mui/material';
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

// Schema for the form UI
const ProfileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  // Allow File object for upload, string for existing URL, or null for removal
  photoURL: z.custom<File | string | null>().optional(),
  email: z.string().email('Invalid email address'),
});

const profileFormConfig = defineForm<typeof ProfileSchema>((f) => [
  f.text('displayName', {
    label: 'Full Name',
    autoFocus: true,
    colProps: { size: { xs: 12, sm: 6 } },
  }),
  f.text('email', {
    label: 'Email Address',
    disabled: true,
    colProps: { size: { xs: 12, sm: 6 } },
  }),
  f.avatar('photoURL', { label: 'Profile Picture' }),
]);

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useRNGAuth();
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Server Actions Hooks
  const { runAction: updateProfile } = useRNGServerAction(updateUserAction, {
    successMessage: 'Profile updated successfully',
  });
  const { runAction: deleteAccount } = useRNGServerAction(deleteAccountAction);
  const { runAction: uploadAvatar } = useRNGServerAction(uploadAvatarAction);

  if (!user) return null;

  return (
    <Stack spacing={4}>
      <Card>
        <CardHeader title="User Profile" subheader="Manage your public profile information" />
        <CardContent>
          <RNGForm
            schema={ProfileSchema}
            uiSchema={profileFormConfig}
            defaultValues={{
              displayName: user.displayName || '',
              photoURL: user.photoUrl || null,
              email: user.email || '',
            }}
            onSubmit={async (data) => {
              let finalPhotoUrl = user.photoUrl;

              // 1. Handle File Upload if a new file is selected
              if (data.photoURL instanceof File) {
                const formData = new FormData();
                formData.append('file', data.photoURL);
                const res = await uploadAvatar(formData);
                if (res?.url) {
                  finalPhotoUrl = res.url;
                }
              } else if (data.photoURL === null) {
                // Handle deletion if explicitly set to null (optional)
                finalPhotoUrl = '';
              }

              // 2. Update Profile Data
              await updateProfile({
                displayName: data.displayName,
                photoUrl: finalPhotoUrl || undefined,
              });

              router.refresh();
            }}
            submitLabel={'Save Changes'}
            requireChanges={true}
          />
        </CardContent>
      </Card>

      <Card sx={{ borderColor: 'error.main' }}>
        <CardHeader title="Security Zone" subheader="Manage your account security and data" />
        <CardContent>
          <Stack spacing={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Button variant="outlined" onClick={() => setPasswordModalOpen(true)}>
                  Change Password
                </Button>
              </Box>
              <Button variant="outlined" color="error" onClick={() => setDeleteModalOpen(true)}>
                Delete Account
              </Button>
            </Box>

            <Alert severity="warning">
              Deleting your account is permanent. All your data including uploaded files will be
              removed immediately.
            </Alert>
          </Stack>
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
          title="Are you sure?"
          description="This action cannot be undone. Please enter your password to confirm deletion."
          confirmLabel="Delete Permanently"
          onConfirm={async () => {
            // 1. Call server action to delete account
            await deleteAccount();

            // 2. UI Feedback
            enqueueSnackbar('Account deleted successfully', { variant: 'success' });
            setDeleteModalOpen(false);

            // 3. Force redirect to login
            router.push('/login');
            router.refresh();
          }}
        />
      )}
    </Stack>
  );
}
