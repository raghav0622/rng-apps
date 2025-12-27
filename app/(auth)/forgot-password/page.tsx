'use client';

import { AuthCard } from '@/app/(auth)/AuthCard';
import { authClient } from '@/core/auth/auth.client';
import { ForgotPasswordSchema } from '@/core/auth/auth.model'; // Use Shared Model
import { logError } from '@/lib/logger';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { useSnackbar } from 'notistack';

export default function ForgotPasswordPage() {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <AuthCard title="Reset Password" description="Enter your email to receive a reset link." footer>
      <RNGForm
        schema={ForgotPasswordSchema}
        uiSchema={[
          { name: 'email', type: 'text', label: 'Email Address', placeholder: 'you@example.com' },
        ]}
        onSubmit={async (data: { email: string }) => {
          try {
            await authClient.sendPasswordResetLink(data.email);
            enqueueSnackbar('Password reset link sent to your email.', { variant: 'success' });
          } catch (err: any) {
            enqueueSnackbar('Failed to send password reset link.');
            logError(err.message);
          }
        }}
        submitLabel="Send Reset Link"
      />
    </AuthCard>
  );
}
