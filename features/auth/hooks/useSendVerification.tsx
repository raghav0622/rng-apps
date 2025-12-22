'use client';

import { clientAuth } from '@/lib/firebase/client';
import { sendEmailVerification } from 'firebase/auth';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

export function useSendVerification() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const sendVerification = async () => {
    const user = clientAuth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      await sendEmailVerification(user, {
        // This URL is where the user lands after clicking the link
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true,
      });

      enqueueSnackbar('Verification email sent! Check your inbox.', { variant: 'success' });
    } catch (error: any) {
      console.error('Send verification error', error);

      // Rate limiting error is common here
      if (error.code === 'auth/too-many-requests') {
        enqueueSnackbar('Too many requests. Please wait a moment.', { variant: 'warning' });
      } else {
        enqueueSnackbar('Failed to send email. Try again later.', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return { sendVerification, loading };
}
