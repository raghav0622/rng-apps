// features/auth/components/EmailVerificationBanner.tsx
'use client';

import { checkVerificationStatusAction } from '@/features/auth/auth.actions';
import { useSendVerification } from '@/features/auth/hooks/useSendVerification';
import { clientAuth } from '@/lib/firebase/client';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { Alert, Box, Button, CircularProgress, Collapse } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useRNGAuth } from './AuthContext';

export function EmailVerificationBanner() {
  const { user } = useRNGAuth();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { sendVerification, loading: sending } = useSendVerification();
  const [isVisible, setIsVisible] = useState(true);

  // ACTION: Check Server Status
  const { runAction: checkStatus, isExecuting: checking } = useRNGServerAction(
    checkVerificationStatusAction,
    {
      onSuccess: (data) => {
        if (data?.verified) {
          enqueueSnackbar('Verified! Refreshing...', { variant: 'success' });
          // 1. Try Soft Refresh
          router.refresh();
          // 2. Force Hard Refresh after 1s if still visible (Safety Net)
          setTimeout(() => window.location.reload(), 1000);
        } else {
          // Check Client SDK locally to debug mismatch
          clientAuth.currentUser?.reload().then(() => {
            if (clientAuth.currentUser?.emailVerified) {
              enqueueSnackbar('Verified locally, syncing to server...', { variant: 'info' });
              // Recursive retry or let the self-healing handle it
            } else {
              enqueueSnackbar('System still sees you as unverified.', { variant: 'warning' });
            }
          });
        }
      },
    },
  );

  // If user is verified, HIDE
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
              {checking ? <CircularProgress size={20} color="inherit" /> : "I've Verified"}
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
        Your email is not verified. Check your inbox or click I have Verified to refresh.
      </Alert>
    </Collapse>
  );
}
