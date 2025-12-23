'use client';

import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { VerifyEmailView } from '@/features/auth/components/VerifyEmailView';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthActionContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  // Case: Missing Code
  if (!oobCode) {
    return (
      <AuthCard
        title="Invalid Link"
        description="This action link is missing required information."
      >
        <Alert severity="error">The configuration code (oobCode) is missing from the URL.</Alert>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button component={Link} href="/login" variant="text">
            Return to Login
          </Button>
        </Box>
      </AuthCard>
    );
  }

  switch (mode) {
    case 'resetPassword':
      return <ResetPasswordForm oobCode={oobCode} />;
    case 'verifyEmail':
      return <VerifyEmailView oobCode={oobCode} />;
    case 'recoverEmail':
      return (
        <AuthCard title="Account Recovery" description="Email recovery assistance">
          <Alert severity="info">
            Email recovery is not yet implemented. Please contact support.
          </Alert>
        </AuthCard>
      );
    default:
      return (
        <AuthCard title="Unknown Action" description="We do not recognize this request.">
          <Alert severity="error">Unknown action mode: {mode}</Alert>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button component={Link} href="/login" variant="text">
              Return to Login
            </Button>
          </Box>
        </AuthCard>
      );
  }
}

function LoadingAuthView() {
  return (
    <AuthCard title="Loading" description="Please wait...">
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    </AuthCard>
  );
}

export default function AuthActionHandlerPage() {
  return (
    <Suspense fallback={<LoadingAuthView />}>
      <AuthActionContent />
    </Suspense>
  );
}
