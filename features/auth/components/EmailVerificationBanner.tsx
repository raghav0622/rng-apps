// features/auth/components/EmailVerificationBanner.tsx
'use client';

import { checkVerificationStatusAction } from '@/features/auth/auth.actions';
import { useSendVerification } from '@/features/auth/hooks/useSendVerification';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { Alert, Box, Button, Collapse } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useRNGAuth } from './AuthContext';

export function EmailVerificationBanner() {
  const { user } = useRNGAuth();
  const router = useRouter();
  const { sendVerification, loading: sending } = useSendVerification();
  const [isVisible, setIsVisible] = useState(true);

  // Action to manually check status if verification happened elsewhere
  const { runAction: checkStatus, isExecuting: checking } = useRNGServerAction(
    checkVerificationStatusAction,
    {
      onSuccess: () => {
        router.refresh();
      },
      // Silence errors (e.g. if they aren't actually verified yet)
      onError: () => {},
    },
  );

  // Note: user.emailVerified comes from your DB/Session sync
  if (!user || user.emailVerified) return null;

  return (
    <Collapse in={isVisible}>
      <Alert
        severity="warning"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              size="small"
              onClick={() => checkStatus()}
              disabled={checking || sending}
            >
              {checking ? 'Checking...' : "I've Verified"}
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={sendVerification}
              disabled={sending || checking}
            >
              {sending ? 'Sending...' : 'Resend Email'}
            </Button>
          </Box>
        }
        onClose={() => setIsVisible(false)}
        sx={{ borderRadius: 0 }}
      >
        Your email is not verified. Please verify it to secure your account.
      </Alert>
    </Collapse>
  );
}
