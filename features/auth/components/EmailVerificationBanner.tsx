// features/auth/components/EmailVerificationBanner.tsx
'use client';

import { useSendVerification } from '@/features/auth/hooks/useSendVerification';
import { Alert, Button, Collapse } from '@mui/material';
import { useState } from 'react';
import { useRNGAuth } from './AuthContext';

export function EmailVerificationBanner() {
  const { user } = useRNGAuth();
  const { sendVerification, loading } = useSendVerification();
  const [isVisible, setIsVisible] = useState(true);

  // Note: user.emailVerified comes from your DB/Session sync
  if (!user || user.emailVerified) return null;

  return (
    <Collapse in={isVisible}>
      <Alert
        severity="warning"
        action={
          <Button color="inherit" size="small" onClick={sendVerification} disabled={loading}>
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        }
        onClose={() => setIsVisible(false)}
        sx={{ borderRadius: 0 }}
      >
        Your email is not verified. Please verify it to secure your account.
      </Alert>
    </Collapse>
  );
}
