'use client';

import { useRNGServerAction } from '@/lib/use-rng-action';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { verifyEmailAction } from '../actions/security.actions';

export function VerifyEmailView({ oobCode }: { oobCode: string }) {
  const router = useRouter();
  const hasExecuted = useRef(false);
  const { runAction, status, result } = useRNGServerAction(verifyEmailAction);

  useEffect(() => {
    if (oobCode && !hasExecuted.current) {
      hasExecuted.current = true;
      runAction({ oobCode });
    }
  }, [oobCode, runAction]);

  if (status === 'executing' || status === 'idle') {
    return (
      <AuthCard
        title="Verifying Email"
        description="Please wait while we verify your email address."
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography color="text.secondary">Processing verification...</Typography>
        </Box>
      </AuthCard>
    );
  }

  if (status === 'hasSucceeded') {
    return (
      <AuthCard title="Email Verified" description="Your email has been successfully verified.">
        <Box sx={{ textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            You can now access all features of your account.
          </Alert>
          <Button variant="contained" fullWidth size="large" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </Box>
      </AuthCard>
    );
  }

  // Error State
  return (
    <AuthCard title="Verification Failed" description="We could not verify your email address.">
      <Box sx={{ textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {result?.serverError || 'The verification link may have expired or is invalid.'}
        </Alert>
        <Button variant="outlined" fullWidth size="large" onClick={() => router.push('/login')}>
          Back to Login
        </Button>
      </Box>
    </AuthCard>
  );
}
