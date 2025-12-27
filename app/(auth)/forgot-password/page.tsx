'use client';

import { authClient } from '@/core/auth/auth.client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

const RequestResetSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

// Define the Form Layout
const formConfig = defineForm<typeof RequestResetSchema>((f) => [
  f.text('email', {
    label: 'Email Address',
    placeholder: 'you@example.com',
  }),
]);

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await authClient.sendPasswordResetLink(data.email);
      setIsSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Security: Don't reveal user existence
        setIsSuccess(true);
      } else {
        setError(err.message || 'Failed to send reset email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthCard
        title="Check your email"
        description="We sent you a link to reset your password."
        footer={
          <Link component={NextLink} href="/login" underline="hover">
            Back to login
          </Link>
        }
      >
        <Typography variant="body1" color="success.main" textAlign="center">
          If an account exists with that email, you will receive a reset link shortly.
        </Typography>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset Password"
      description="Enter your email to receive a reset link."
      footer={
        <Link component={NextLink} href="/login" underline="hover">
          Back to login
        </Link>
      }
    >
      <RNGForm
        schema={RequestResetSchema}
        uiSchema={formConfig}
        onSubmit={handleSubmit}
        submitLabel={isLoading ? 'Sending...' : 'Send Reset Link'}
      />
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}
    </AuthCard>
  );
}
