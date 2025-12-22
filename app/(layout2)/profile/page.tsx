// app/(layout2)/profile/page.tsx
'use client';

import { deleteAccountAction, updateUserAction } from '@/features/auth/actions/profile.actions';
import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { ChangePasswordModal } from '@/features/auth/components/ChangePasswordModal';
import { ConfirmPasswordModal } from '@/features/auth/components/ConfirmPasswordModal';
import { uploadAvatarAction } from '@/features/storage/storage.actions';
import { AppErrorCode } from '@/lib/errors';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Alert, Box, Button, Card, CardContent, CardHeader, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { z } from 'zod';

// --- Schema & Form Definition ---
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
  const { enqueueSnackbar } = useSnackbar();

  // --- Actions ---

  // 1. Update Profile Action
  const { runAction: updateProfile, isExecuting: isUpdating } = useRNGServerAction(
    //@ts-expect-error Types mismatch on Date objects in Zod (Known Issue)
    updateUserAction,
    {
      onSuccess: () => {
        enqueueSnackbar('Profile updated successfully', { variant: 'success' });
        router.refresh();
      },
      onError: (msg, code) => {
        if (code === AppErrorCode.UNAUTHENTICATED) {
          enqueueSnackbar('Session expired. Redirecting to login...', { variant: 'warning' });
          router.push('/login?reason=session_expired');
        } else {
          enqueueSnackbar(msg || 'Failed to update profile', { variant: 'error' });
        }
      },
    },
  );

  // 2. Upload Avatar Action (Helper)
  const { runAction: uploadAvatar } = useRNGServerAction(uploadAvatarAction);

  // 3. Delete Account Action
  const { runAction: deleteAccount, isExecuting: isDeleting } = useRNGServerAction(
    deleteAccountAction,
    {
      onSuccess: () => {
        enqueueSnackbar('Account deleted successfully', { variant: 'success' });
        window.location.href = '/login'; // Hard redirect to ensure clean slate
      },
      onError: (msg) => {
        enqueueSnackbar(msg || 'Failed to delete account', { variant: 'error' });
      },
    },
  );

  if (!user) return null;

  return (
    <Stack spacing={4}>
      {/* --- Profile Update Section --- */}
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
            submitLabel={isUpdating ? 'Saving...' : 'Save Changes'}
            requireChanges={true}
            onSubmit={async (data) => {
              try {
                let finalPhotoUrl: string | undefined = undefined;

                // Handle File Upload
                if (data.photoURL instanceof File) {
                  const res = await uploadAvatar({ file: data.photoURL });
                  if (!res?.url) throw new Error('Upload failed');
                  finalPhotoUrl = res.url;
                }
                // Handle Explicit Removal
                else if (data.photoURL === null || data.photoURL === '') {
                  finalPhotoUrl = '';
                }
                // Handle No Change
                else if (typeof data.photoURL === 'string') {
                  finalPhotoUrl = data.photoURL === user.photoUrl ? undefined : data.photoURL;
                }

                await updateProfile({
                  displayName: data.displayName,
                  photoUrl: finalPhotoUrl ?? undefined,
                });
              } catch (error: any) {
                console.error(error);
                enqueueSnackbar(error.message, { variant: 'error' });
              }
            }}
          />
        </CardContent>
      </Card>

      {/* --- Security Zone --- */}
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
              {/* Change Password Modal with Trigger */}
              <ChangePasswordModal trigger={<Button variant="outlined">Change Password</Button>} />

              {/* Delete Account Modal with Trigger */}
              <ConfirmPasswordModal
                title="Are you sure?"
                description="This action cannot be undone. Please enter your password to confirm deletion."
                confirmLabel="Delete Permanently"
                onConfirm={async () => {
                  await deleteAccount();
                }}
                trigger={
                  <Button variant="outlined" color="error" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                }
              />
            </Box>

            <Alert severity="warning">
              Deleting your account is permanent. All your data including uploaded files will be
              removed immediately.
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
