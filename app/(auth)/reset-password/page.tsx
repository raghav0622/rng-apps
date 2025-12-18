'use client';

import { ResetPasswordInput, ResetPasswordSchema } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { Suspense, useEffect, useState } from 'react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const oobCode = searchParams.get('oobCode');

  const [email, setEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [linkStatus, setLinkStatus] = useState<'valid' | 'invalid' | 'used'>('valid');

  useEffect(() => {
    if (!oobCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLinkStatus('invalid');
      setIsVerifying(false);
      return;
    }

    // Verify the code
    verifyPasswordResetCode(clientAuth, oobCode)
      .then((emailAddress) => {
        setEmail(emailAddress);
        setIsVerifying(false);
      })
      .catch((error) => {
        console.error('Link verification failed:', error);
        // If the code is invalid, it might be expired OR already used (on the Firebase page)
        setLinkStatus('used');
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

  // Handle the case where the link is invalid/used
  if (linkStatus !== 'valid') {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3, justifyContent: 'center' }}>
          Link Expired or Already Used
        </Alert>
        <Typography paragraph color="text.secondary">
          This usually happens if you already reset your password on the previous screen.
        </Typography>
        <Typography paragraph>
          If you successfully reset your password just now, you can log in.
        </Typography>
        <Button variant="contained" component={Link} href="/login">
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <>
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
