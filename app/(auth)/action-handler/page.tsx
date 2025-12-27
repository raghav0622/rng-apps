'use client';

import { authClient } from '@/core/auth/auth.client';
import { ResetPasswordSchema } from '@/core/auth/auth.model'; // Use Shared Model
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Alert, Box, CircularProgress, Container, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

// DSL Config
const formConfig = defineForm<typeof ResetPasswordSchema>((f) => [
  f.password('password', { label: 'New Password', placeholder: 'Enter new password' }),
  f.password('confirmPassword', {
    label: 'Confirm Password',
    placeholder: 'Re-enter new password',
  }),
]);

type ActionState = 'LOADING' | 'SUCCESS' | 'ERROR' | 'IDLE';

function ActionHandlerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL Parameters from Firebase
  const mode = searchParams.get('mode'); // 'resetPassword' | 'verifyEmail' | 'recoverEmail'
  const oobCode = searchParams.get('oobCode');

  const [status, setStatus] = useState<ActionState>('LOADING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  // --- Handlers ---

  useEffect(() => {
    if (!oobCode || !mode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('ERROR');
      setErrorMessage('Invalid link. Missing parameters.');
      return;
    }

    // 1. Handle Email Verification Immediately
    if (mode === 'verifyEmail') {
      authClient
        .verifyEmail(oobCode)
        .then(() => setStatus('SUCCESS'))
        .catch((err) => {
          setStatus('ERROR');
          setErrorMessage(err.message || 'Failed to verify email.');
        });
    }

    // 2. Handle Password Reset Initialization
    else if (mode === 'resetPassword') {
      authClient
        .verifyResetCode(oobCode)
        .then((email) => {
          setVerifiedEmail(email);
          setStatus('IDLE'); // Ready to show form
        })
        .catch(() => {
          setStatus('ERROR');
          setErrorMessage('This link has expired or has already been used.');
        });
    } else {
      setStatus('ERROR');
      setErrorMessage(`Unknown mode: ${mode}`);
    }
  }, [mode, oobCode]);

  // 3. Handle Password Reset Submission
  const handleResetSubmit = async (data: z.infer<typeof ResetPasswordSchema>) => {
    if (!oobCode) return;
    try {
      await authClient.confirmPasswordReset(oobCode, data.password);
      setStatus('SUCCESS');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    }
  };

  // --- Render ---

  if (status === 'LOADING') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'ERROR') {
    return (
      <Container maxWidth="xs" sx={{ mt: 10 }}>
        <Alert severity="error">{errorMessage}</Alert>
      </Container>
    );
  }

  // Success State
  if (status === 'SUCCESS') {
    return (
      <Container maxWidth="xs" sx={{ mt: 10, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          {mode === 'verifyEmail'
            ? 'Email verified successfully! You can now close this tab.'
            : 'Password reset successfully! Redirecting to login...'}
        </Alert>
      </Container>
    );
  }

  // Password Reset Form State (IDLE)
  if (mode === 'resetPassword') {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Reset Password
          </Typography>
          <Typography color="text.secondary">for {verifiedEmail}</Typography>
        </Box>

        <RNGForm
          schema={ResetPasswordSchema}
          uiSchema={formConfig}
          onSubmit={handleResetSubmit}
          submitLabel="Reset Password"
        />
      </Container>
    );
  }

  return null;
}

export default function ActionHandlerPage() {
  return <ActionHandlerContent />;
}
