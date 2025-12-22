'use client';

import { checkVerificationStatusAction } from '@/features/auth/actions/security.actions';
import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { useSendVerification } from '@/features/auth/hooks/useSendVerification';
import { clientAuth } from '@/lib/firebase/client';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { AlertBanner } from '@/ui/feedback/AlertBanner';
import { Box, Button, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

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
          router.refresh();
          // Safety Net: Force reload if state doesn't settle
          setTimeout(() => window.location.reload(), 1000);
        } else {
          // Fallback: Check Client SDK locally
          clientAuth.currentUser?.reload().then(() => {
            if (clientAuth.currentUser?.emailVerified) {
              enqueueSnackbar('Verified locally, syncing...', { variant: 'info' });
            } else {
              enqueueSnackbar('System still sees you as unverified.', { variant: 'warning' });
            }
          });
        }
      },
    },
  );

  if (!user || user.emailVerified) return null;

  return (
    <AlertBanner
      severity="warning"
      isVisible={isVisible}
      onDismiss={() => setIsVisible(false)}
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
    >
      Your email is not verified. Check your inbox or click I&apos;ve Verified to refresh.
    </AlertBanner>
  );
}
