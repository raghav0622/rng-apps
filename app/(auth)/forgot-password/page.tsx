'use client';

import { AuthCard } from '@/app/(auth)/AuthCard';
import { authClient } from '@/core/auth/auth.client';
import { ForgotPasswordSchema } from '@/core/auth/auth.model';
import { logError } from '@/lib/logger';
import { defineForm } from '@/rng-form';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { useSnackbar } from 'notistack';

const forgotPasswordUiSchema = defineForm<typeof ForgotPasswordSchema>((f) => [
  f.text('email', { label: 'Email Address', placeholder: 'you@example.com' }),
]);

export default function ForgotPasswordPage() {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <AuthCard title="Reset Password" description="Enter your email to receive a reset link." footer>
      <RNGForm
        schema={ForgotPasswordSchema}
        uiSchema={forgotPasswordUiSchema}
        onSubmit={async (data) => {
          try {
            await authClient.sendPasswordResetLink(data.email);
            enqueueSnackbar('Password reset link sent to your email.', { variant: 'success' });
          } catch (err: any) {
            enqueueSnackbar(err.message || 'Failed to send password reset link.', {
              variant: 'error',
            });
            logError(err.message);
          }
        }}
        submitLabel="Send Reset Link"
      />
    </AuthCard>
  );
}
