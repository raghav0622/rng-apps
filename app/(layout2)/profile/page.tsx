// app/(layout2)/profile/page.tsx
'use client';

import { deleteAccountAction } from '@/features/auth/actions/profile.actions';
import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { uploadAvatarAction } from '@/features/storage/storage.actions';
import { AppErrorCode } from '@/lib/errors';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Alert, Box, Button, Card, CardContent, CardHeader, Stack } from '@mui/material';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { z } from 'zod';

// --- Dynamic Imports for Modals (Code Splitting) ---
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

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  // --- Actions ---

  // 1. Update Profile Action with Session Error Handling
  const { runAction: updateProfile, isExecuting: isUpdating } = useRNGServerAction(
    //@ts-expect-error yolo
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
        window.location.href = '/login'; // Hard redirect to clear client state
      },
      onError: (msg, code) => {
        if (code === AppErrorCode.UNAUTHENTICATED) {
          // If session is already gone, just redirect
          window.location.href = '/login';
        } else {
          enqueueSnackbar(msg || 'Failed to delete account', { variant: 'error' });
        }
        setDeleteModalOpen(false);
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
                let finalPhotoUrl: string | undefined = undefined; // Start undefined (no change)

                // Case 1: New File Uploaded
                if (data.photoURL instanceof File) {
                  const res = await uploadAvatar({ file: data.photoURL });
                  if (!res?.url) throw new Error('Upload failed');
                  finalPhotoUrl = res.url;
                }
                // Case 2: Explicit Removal (Check for null OR empty string)
                // The form might return null or "" when you click the "X"
                else if (data.photoURL === null || data.photoURL === '') {
                  finalPhotoUrl = ''; // This is our "DELETE" signal
                }
                // Case 3: No Change (It's the existing URL string)
                else if (typeof data.photoURL === 'string') {
                  // If it matches the user's current url, send undefined to skip processing
                  if (data.photoURL === user.photoUrl) {
                    finalPhotoUrl = undefined;
                  } else {
                    finalPhotoUrl = data.photoURL;
                  }
                }

                // DEBUG: Uncomment to verify what is being sent
                // console.log('Sending photoUrl:', finalPhotoUrl === '' ? 'EMPTY STRING' : finalPhotoUrl);

                await updateProfile({
                  displayName: data.displayName,
                  // CRITICAL FIX: Use '??' so that empty string "" is preserved!
                  // If we used '||', "" would become undefined.
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
              <Box>
                <Button variant="outlined" onClick={() => setPasswordModalOpen(true)}>
                  Change Password
                </Button>
              </Box>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteModalOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </Box>

            <Alert severity="warning">
              Deleting your account is permanent. All your data including uploaded files will be
              removed immediately.
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      {/* --- Modals --- */}
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
            // This calls the server action which handles DB cleanup
            await deleteAccount();
          }}
        />
      )}
    </Stack>
  );
}
