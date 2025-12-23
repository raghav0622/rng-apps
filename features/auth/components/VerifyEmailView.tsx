'use client';

import { AuthCard } from '@/ui/auth/AuthCard';
import { LoadingSpinner } from '@/ui/LoadingSpinner';
import { Alert, Box, Button } from '@mui/material';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFirebaseClientAuth } from '../hooks/useFirebaseClientAuth';

interface VerifyEmailViewProps {
  oobCode: string;
}

export function VerifyEmailView({ oobCode }: VerifyEmailViewProps) {
  const { verifyEmailCode } = useFirebaseClientAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    verifyEmailCode(oobCode)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [oobCode, verifyEmailCode]);

  if (status === 'loading') return <LoadingSpinner message="Verifying email..." />;

  return (
    <AuthCard
      title={status === 'success' ? 'Email Verified' : 'Verification Failed'}
      description={
        status === 'success' ? 'Your account is now verified.' : 'Invalid verification link.'
      }
    >
      {status === 'success' ? (
        <Alert severity="success">
          Thank you for verifying your email. You can now access all features.
        </Alert>
      ) : (
        <Alert severity="error">
          This link is invalid or expired. Please request a new verification email from your
          profile.
        </Alert>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button component={Link} href="/dashboard" variant="contained">
          Go to Dashboard
        </Button>
      </Box>
    </AuthCard>
  );
}
