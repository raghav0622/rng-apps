'use client';

import { useRNGAuth } from '@/core/auth/auth.context';
import { authClient } from '@/core/auth/auth.client';
import { updateProfileAction } from '@/core/auth/profile.actions';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { SessionManager } from './SessionManager';
import { rngFormBuilder } from '@/rng-form';
import { z } from 'zod';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { 
  Box, 
  Container, 
  Typography, 
  Alert, 
  Button, 
  Stack, 
  Card, 
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import { useState, useTransition } from 'react';
import { useSnackbar } from 'notistack';
import { LoadingSpinner } from '@/rng-ui/components/LoadingSpinner';

// Profile update schema
const ProfileUpdateSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  photoFile: z.instanceof(File).optional().nullable(),
});

type ProfileFormData = z.infer<typeof ProfileUpdateSchema>;

// Build form with rng-form
const profileForm = rngFormBuilder<typeof ProfileUpdateSchema>()
  .avatar('photoFile', {
    label: 'Profile Picture',
    width: 140,
    description: 'Upload a profile picture (Max 5MB)',
    placeholder: 'Click to upload',
  })
  .text('displayName', {
    label: 'Display Name',
    placeholder: 'Enter your full name',
    description: 'This name will be visible to other users',
  })
  .build();

export default function ProfilePage() {
  const { user } = useRNGAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const { execute: updateProfile, isExecuting } = useRngAction(updateProfileAction, {
    onSuccess: () => {
      enqueueSnackbar('Profile updated successfully!', { variant: 'success' });
      // Refresh the page to get updated user data
      window.location.reload();
    },
    onError: ({ error }) => {
      enqueueSnackbar(error.message || 'Failed to update profile', { variant: 'error' });
    },
  });

  const handleResendVerification = async () => {
    setIsVerifying(true);
    try {
      await authClient.sendVerificationEmail();
      enqueueSnackbar('Verification email sent! Please check your inbox.', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to send verification email.', { variant: 'error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.photoURL) return;
    
    startTransition(async () => {
      const result = await updateProfile({ removePhoto: true });
      if (result?.success) {
        enqueueSnackbar('Profile picture removed', { variant: 'success' });
        window.location.reload();
      }
    });
  };

  const handleSubmit = async (data: ProfileFormData) => {
    await updateProfile(data);
  };

  if (!user) return <LoadingSpinner />;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box mb={6}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Account Settings
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Manage your personal information and security sessions.
        </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Email Verification Banner */}
        {!user.emailVerified && (
          <Alert 
            severity="warning" 
            variant="outlined"
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleResendVerification}
                disabled={isVerifying}
              >
                {isVerifying ? 'Sending...' : 'Resend Verification'}
              </Button>
            }
          >
            Your email address is not verified. Please check your inbox or click resend.
          </Alert>
        )}

        {/* Profile Editor */}
        <Card variant="outlined">
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Edit Profile
            </Typography>
          </Box>
          <CardContent>
            <RNGForm
              schema={ProfileUpdateSchema}
              definition={profileForm}
              onSubmit={handleSubmit}
              defaultValues={{
                displayName: user.displayName || '',
                photoFile: user.photoURL || null,
              }}
              submitButton={{
                text: isExecuting ? 'Saving...' : 'Save Changes',
                disabled: isExecuting,
              }}
            />
            
            {user.photoURL && (
              <Box mt={2}>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleRemovePhoto}
                  disabled={isPending || isExecuting}
                >
                  {isPending ? 'Removing...' : 'Remove Profile Picture'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Current Profile Details */}
        <Card variant="outlined">
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Current Profile
            </Typography>
          </Box>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  Full Name
                </Typography>
                <Typography variant="body1">{user.displayName || 'Not provided'}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  Email Address
                </Typography>
                <Typography variant="body1">{user.email}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Security & Active Sessions
          </Typography>
          <SessionManager />
        </Box>
      </Stack>
    </Container>
  );
}
