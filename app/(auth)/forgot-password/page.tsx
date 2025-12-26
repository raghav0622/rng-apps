'use client';

import { authClient } from '@/core/auth/auth.client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Link } from '@mui/material';
import NextLink from 'next/link';
import { useSnackbar } from 'notistack';
import { z } from 'zod';

// Define strict schema for the form
const ForgotPasswordSchema = z.object({
  email: z.email(),
});

// Define the Form Layout (DSL)
const formConfig = defineForm<typeof ForgotPasswordSchema>((f) => [
  f.text('email', {
    label: 'Email Address',
    placeholder: 'you@example.com',
  }),
]);

export default function LoginPage() {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <AuthCard
      title="Reset Your Password"
      description="Please enter your email."
      footer={
        <>
          Remember your password?{' '}
          <Link component={NextLink} href="/login" underline="hover">
            Log In
          </Link>
        </>
      }
    >
      <RNGForm
        schema={ForgotPasswordSchema}
        uiSchema={formConfig}
        onSubmit={async (data) => {
          await authClient.sendPasswordResetLink(data.email);
          enqueueSnackbar('Reset Password Link Sent!', { variant: 'success' });
        }}
        submitLabel="Sign In"
      />
    </AuthCard>
  );
}
