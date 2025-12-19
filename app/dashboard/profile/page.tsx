'use client';

import { deleteAccountAction } from '@/features/auth/auth.actions';
import { useProfileManager } from '@/features/auth/hooks/useProfileManager';
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
  const { user, updateProfileData, isUpdating } = useProfileManager();

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  if (!user) return null;

  return (
    <Stack spacing={4} maxWidth="md" mx="auto">
      <Card>
        <CardHeader title="User Profile" subheader="Manage your public profile information" />
        <CardContent>
          <RNGForm
            schema={ProfileSchema}
            uiSchema={profileFormConfig}
            defaultValues={{
              displayName: user.displayName || '',
              photoURL: user.photoURL || null,
              email: user.email || '',
            }}
            onSubmit={updateProfileData}
            submitLabel={isUpdating ? 'Saving...' : 'Save Changes'}
            requireChanges={true} // Only enable save if dirty
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
            const res = await deleteAccountAction();
            if (res?.serverError) {
              throw new Error(res.serverError.message || 'Failed to delete account');
            }
            // Manual client-side redirect to avoid server-action redirect race conditions
            enqueueSnackbar('Account deleted successfully', { variant: 'success' });
            setDeleteModalOpen(false);
            router.push('/login');
          }}
        />
      )}
    </Stack>
  );
}
