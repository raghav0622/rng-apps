'use client';

import { clientAuth } from '@/lib/firebase/client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Box, Link as MuiLink, Typography } from '@mui/material';
import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { z } from 'zod';

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (data: ForgotPasswordInput) => {
    try {
      await sendPasswordResetEmail(clientAuth, data.email, {
        // This URL is where Firebase will redirect the user AFTER they click the email link.
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
      setIsSent(true);
      enqueueSnackbar('Reset email sent!', { variant: 'success' });
    } catch (error: any) {
      const msg =
        error.code === 'auth/user-not-found' ? 'No user found with that email.' : error.message;
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  if (isSent) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Check your email
        </Typography>
        <Typography color="text.secondary" paragraph>
          We sent a link to reset your password. Be sure to check your spam folder.
        </Typography>
        <MuiLink component={Link} href="/login" variant="button">
          Back to Sign In
        </MuiLink>
      </Box>
    );
  }

  return (
    <>
      <RNGForm
        schema={ForgotPasswordSchema}
        defaultValues={{ email: '' }}
        onSubmit={handleSubmit}
        title="Reset Password"
        description="Enter your email to receive reset instructions"
        submitLabel="Send Reset Link"
        uiSchema={[
          {
            name: 'email',
            type: 'text',
            label: 'Email Address',
          },
        ]}
      />
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <MuiLink component={Link} href="/login" variant="body2">
          Back to Sign In
        </MuiLink>
      </Box>
    </>
  );
}
