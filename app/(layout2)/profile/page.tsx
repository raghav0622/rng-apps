'use client';

import { useRNGAuth } from '@/core/auth/auth.context';
import { authClient } from '@/core/auth/auth.client';
import { SessionManager } from '@/app/(protected)/profile/SessionManager';
import { NotificationSettings } from '@/core/notifications/components/NotificationSettings';
import { 
  Box, 
  Container, 
  Typography, 
  Alert, 
  Button, 
  Stack, 
  Card, 
  CardContent,
  Divider
} from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from 'notistack';

export default function ProfilePage() {
  const { user } = useRNGAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isVerifying, setIsVerifying] = useState(false);

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

  if (!user) return null;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box mb={6}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Account Settings
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Manage your personal information, security, and notification preferences.
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

        {/* Profile Details */}
        <Card variant="outlined">
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Profile Details
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

        {/* Notification Preferences */}
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Notification Preferences
          </Typography>
          <NotificationSettings />
        </Box>

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
