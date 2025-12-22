// app/(auth)/verify-email/page.tsx
'use client';

import { verifyEmailSyncAction } from '@/features/auth/auth.actions';
import { clientAuth } from '@/lib/firebase/client';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { applyActionCode } from 'firebase/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // "oobCode" is the one-time code Firebase appends to the URL
  const oobCode = searchParams.get('oobCode');
  const { runAction: syncVerification } = useRNGServerAction(verifyEmailSyncAction);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!oobCode) {
      setStatus('error');
      setErrorMessage('Invalid verification link. Code is missing.');
      return;
    }

    // Attempt to verify the code
    applyActionCode(clientAuth, oobCode)
      .then(async () => {
        setStatus('success');

        // Reload client user to see changes in Client SDK immediately
        await clientAuth.currentUser?.reload();

        // TELL SERVER TO SYNC DATABASE
        // If this fails (e.g. user is on mobile and not logged in),
        // we ignore it. The "I've Verified" button or next login will sync it.
        try {
          await syncVerification();
        } catch (error) {
          console.log('Cross-device verification: DB will sync on next login.');
        }
      })
      .catch((error) => {
        console.error('Verification failed:', error);
        let msg = 'Failed to verify email. The link may be expired or already used.';
        if (error.code === 'auth/invalid-action-code') {
          msg = 'Invalid or expired verification code.';
        }
        setStatus('error');
        setErrorMessage(msg);
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
        <Alert severity="error" sx={{ mb: 3, justifyContent: 'center' }}>
          Verification Failed
        </Alert>
        <Typography paragraph color="text.secondary">
          {errorMessage}
        </Typography>
        <Button variant="contained" component={Link} href="/login">
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Alert severity="success" sx={{ mb: 3, justifyContent: 'center' }}>
        Email Verified Successfully!
      </Alert>
      <Typography paragraph>
        Your account is now verified. You can access all features of the application.
      </Typography>
      <Button variant="contained" component={Link} href="/dashboard">
        Continue to Dashboard
      </Button>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
