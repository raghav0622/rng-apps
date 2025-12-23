'use client';

import { ProfileSchema } from '@/features/auth/auth.model';
import { ActiveSessions } from '@/features/auth/components/ActiveSessions';
import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { ChangePasswordModal } from '@/features/auth/components/ChangePasswordModal';
import { ConfirmPasswordModal } from '@/features/auth/components/ConfirmPasswordModal';
import { useProfile } from '@/features/auth/hooks/useProfile'; // New Hook
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Alert, Box, Button, Card, CardContent, CardHeader, Stack } from '@mui/material';

// Form Configuration (Visuals only)
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
  const { user } = useRNGAuth();
  // All business logic is now here
  const { handleUpdateProfile, deleteAccount, isUpdating, isDeleting } = useProfile();

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
            onSubmit={(data) => handleUpdateProfile(data, user.photoUrl)}
          />
        </CardContent>
      </Card>
      <ActiveSessions />

      {/* --- Security Zone --- */}
      <Card sx={{ borderColor: 'error.main' }}>
        <CardHeader title="Security Zone" subheader="Manage your account security and data" />
        <CardContent>
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <ChangePasswordModal trigger={<Button variant="outlined">Change Password</Button>} />

              <ConfirmPasswordModal
                title="Delete Account?"
                description="This cannot be undone. All data will be lost."
                confirmLabel="Delete Permanently"
                onConfirm={async () => await deleteAccount()}
                trigger={
                  <Button variant="outlined" color="error" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                }
              />
            </Box>

            <Alert severity="warning">Deleting your account is permanent.</Alert>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
