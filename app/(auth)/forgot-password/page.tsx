'use client';

import { clientAuth } from '@/lib/firebase/client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Box, Link as MuiLink } from '@mui/material';
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
        url: `${window.location.origin}/auth-action-handler?mode=resetPassword`, // Pointing to the handler correctly
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

  // State: Email Sent Success
  if (isSent) {
    return (
      <AuthCard
        title="Check your email"
        description="We sent a link to reset your password. Be sure to check your spam folder."
      >
        <Box sx={{ textAlign: 'center' }}>
          <MuiLink component={Link} href="/login" variant="button" fontWeight="bold">
            Back to Sign In
          </MuiLink>
        </Box>
      </AuthCard>
    );
  }

  const Footer = (
    <MuiLink component={Link} href="/login" variant="body2" underline="hover" fontWeight="500">
      Back to Sign In
    </MuiLink>
  );

  return (
    <AuthCard
      title="Reset Password"
      description="Enter your email to receive reset instructions"
      footer={Footer}
    >
      <RNGForm
        schema={ForgotPasswordSchema}
        defaultValues={{ email: '' }}
        onSubmit={handleSubmit}
        submitLabel="Send Reset Link"
        uiSchema={[
          {
            name: 'email',
            type: 'text',
            label: 'Email Address',
            autoFocus: true,
          },
        ]}
      />
    </AuthCard>
  );
}
