// app/(auth)/verify-email/page.tsx
'use client';

import { verifyEmailSyncAction } from '@/features/auth/auth.actions';
import { clientAuth } from '@/lib/firebase/client';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { applyActionCode } from 'firebase/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const { runAction: syncVerification } = useRNGServerAction(verifyEmailSyncAction);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!oobCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      setErrorMessage('Invalid verification link.');
      return;
    }

    // 1. Verify with Firebase Auth
    applyActionCode(clientAuth, oobCode)
      .then(async () => {
        setStatus('success');

        // 2. Try to Sync DB (Best Effort)
        try {
          if (clientAuth.currentUser) {
            await clientAuth.currentUser.reload();
            await syncVerification();
          }
        } catch (e) {}
      })
      .catch((error) => {
        console.error('Verification failed', error);
        setStatus('error');
        setErrorMessage('This link is invalid or has expired.');
      });
  }, [oobCode, syncVerification]);

  if (status === 'verifying') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Verifying your email address...</Typography>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Verification Failed
        </Alert>
        <Typography color="text.secondary" paragraph>
          {errorMessage}
        </Typography>
        <Button variant="contained" component={Link} href="/login">
          Back to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Alert severity="success" sx={{ mb: 3 }}>
        Email Verified Successfully!
      </Alert>
      <Typography paragraph>You can now return to the Dashboard.</Typography>
      <Button variant="contained" component={Link} href="/dashboard">
        Go to Dashboard
      </Button>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
