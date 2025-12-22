// app/(layout2)/profile/page.tsx
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

// ... (Imports and Modal/Schema definitions remain the same)
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

  // Note: we handle success manually for deleteAccount to control the redirect
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

              if (data.photoURL instanceof File) {
                const res = await uploadAvatar({ file: data.photoURL });
                if (res?.url) {
                  finalPhotoUrl = res.url;
                }
              } else if (data.photoURL === null) {
                finalPhotoUrl = '';
              }

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
            try {
              // 1. Call server action
              // If this throws "Invalid session", it means we might be partially deleted or token expired
              await deleteAccount();

              enqueueSnackbar('Account deleted successfully', { variant: 'success' });
            } catch (error: any) {
              // If we get an authentication error during delete, it likely means
              // the user is already in an invalid state (or deleted).
              // We should treat this as a signal to logout/redirect anyway.
              if (
                error?.message?.includes('Invalid session') ||
                error?.code === 'UNAUTHENTICATED'
              ) {
                // Swallow error and proceed to redirect
              } else {
                // Show other errors (e.g. DB error)
                enqueueSnackbar('Failed to delete account. Please try again.', {
                  variant: 'error',
                });
                setDeleteModalOpen(false);
                return;
              }
            }

            // 2. Force hard redirect to clear client state
            // Do NOT use router.refresh() here as it may trigger protected route checks
            window.location.href = '/login';
          }}
        />
      )}
    </Stack>
  );
}
