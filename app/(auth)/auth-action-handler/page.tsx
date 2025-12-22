'use client';

import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { VerifyEmailView } from '@/features/auth/components/VerifyEmailView';
import { Alert, Card, CardContent } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthActionContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  if (!oobCode) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">Invalid action link. The code is missing.</Alert>
        </CardContent>
      </Card>
    );
  }

  switch (mode) {
    case 'resetPassword':
      return <ResetPasswordForm oobCode={oobCode} />;
    case 'verifyEmail':
      return <VerifyEmailView oobCode={oobCode} />;
    case 'recoverEmail':
      return (
        <Card>
          <CardContent>
            <Alert severity="info">
              Email recovery is not yet implemented. Please contact support.
            </Alert>
          </CardContent>
        </Card>
      );
    default:
      return (
        <Card>
          <CardContent>
            <Alert severity="error">Unknown action mode: {mode}</Alert>
          </CardContent>
        </Card>
      );
  }
}

export default function AuthActionHandlerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthActionContent />
    </Suspense>
  );
}
