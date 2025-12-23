'use client';

import { ForgotPasswordSchema } from '@/features/auth/auth.model';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { AuthCard } from '@/ui/auth/AuthCard';
import { AuthNavigation } from '@/ui/auth/AuthNavigation';
import { Box, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { handleSubmit, isSent } = useForgotPassword();

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

  return (
    <AuthCard
      title="Reset Password"
      description="Enter your email to receive reset instructions"
      footer={<AuthNavigation mode="forgot-password" />}
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
