'use client';

import { Alert, Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useFirebaseClientAuth } from '../hooks/useFirebaseClientAuth';
import { useRNGAuth } from './AuthContext'; //

export function EmailVerificationBanner() {
  const { sendVerification } = useFirebaseClientAuth();
  const { firebaseUser } = useRNGAuth(); // Use reactive user from context
  const { enqueueSnackbar } = useSnackbar();
  const [sending, setSending] = useState(false);

  // Use firebaseUser instead of currentUser. This ensures the component re-renders when auth state loads.
  if (!firebaseUser || firebaseUser.emailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await sendVerification();
      enqueueSnackbar('Verification email sent!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to send email. Try again later.', { variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" onClick={handleResend} disabled={sending}>
          {sending ? 'Sending...' : 'Resend Email'}
        </Button>
      }
      sx={{ mb: 2 }}
    >
      Your email is not verified. Please check your inbox.
    </Alert>
  );
}
