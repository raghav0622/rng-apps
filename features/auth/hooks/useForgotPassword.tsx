'use client';

import { ForgotPasswordInput } from '@/features/auth/auth.model';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useFirebaseClientAuth } from './useFirebaseClientAuth';

export function useForgotPassword() {
  const [isSent, setIsSent] = useState(false);
  const { sendResetEmail } = useFirebaseClientAuth();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (data: ForgotPasswordInput) => {
    try {
      await sendResetEmail(data.email);
      setIsSent(true);
      enqueueSnackbar('Reset email sent!', { variant: 'success' });
    } catch (error: any) {
      const msg =
        error.code === 'auth/user-not-found'
          ? 'No user found with that email.'
          : error.message || 'Failed to send reset email';

      enqueueSnackbar(msg, { variant: 'error' });
      // We purposefully don't throw here to prevent RNGForm generic error handling
      // if we want to rely on the specific snackbar message.
    }
  };

  return { handleSubmit, isSent };
}
