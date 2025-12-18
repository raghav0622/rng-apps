'use client';

import { ResetPasswordInput, ResetPasswordSchema } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { Suspense, useEffect, useState } from 'react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  // Get the code from the URL (Firebase appends ?oobCode=...)
  const oobCode = searchParams.get('oobCode');

  const [email, setEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInvalid(true);
      setIsVerifying(false);
      return;
    }

    // 1. Verify the code is valid AND get the email address associated with it
    verifyPasswordResetCode(clientAuth, oobCode)
      .then((emailAddress) => {
        setEmail(emailAddress);
        setIsVerifying(false);
      })
      .catch((error) => {
        console.error('Link verification failed:', error);
        setIsInvalid(true);
        setIsVerifying(false);
      });
  }, [oobCode]);

  const handleSubmit = async (data: ResetPasswordInput) => {
    if (!oobCode) return;
    try {
      await confirmPasswordReset(clientAuth, oobCode, data.password);
      enqueueSnackbar('Password reset successful! Please log in.', { variant: 'success' });
      router.push('/login');
    } catch (error: any) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  if (isVerifying) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Verifying reset link...</Typography>
      </Box>
    );
  }

  if (isInvalid) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Invalid or Expired Link
        </Typography>
        <Typography paragraph color="text.secondary">
          This password reset link is invalid or has already been used. Please request a new one.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Display the email address we verified */}
      {email && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Resetting password for <strong>{email}</strong>
        </Alert>
      )}

      <RNGForm
        schema={ResetPasswordSchema}
        defaultValues={{ password: '', confirmPassword: '' }}
        onSubmit={handleSubmit}
        title="Set New Password"
        submitLabel="Reset Password"
        uiSchema={[
          {
            name: 'password',
            type: 'password',
            label: 'New Password',
          },
          {
            name: 'confirmPassword',
            type: 'password',
            label: 'Confirm Password',
          },
        ]}
      />
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
