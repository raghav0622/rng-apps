'use client';

import { ResetPasswordSchema } from '@/features/auth/auth.model';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Alert, Link, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { confirmPasswordResetAction } from '../actions/security.actions';

const resetPasswordFormConfig = defineForm<typeof ResetPasswordSchema>((f) => [
  f.password('password', {
    label: 'New Password',
    autoFocus: true,
  }),
  f.password('confirmPassword', {
    label: 'Confirm New Password',
  }),
]);

export function ResetPasswordForm({ oobCode }: { oobCode: string }) {
  const router = useRouter();

  const { runAction, status, result } = useRNGServerAction(confirmPasswordResetAction, {
    onSuccess: () => {
      setTimeout(() => router.push('/login'), 2000);
    },
  });

  if (status === 'hasSucceeded') {
    return (
      <AuthCard title="Password Reset" description="Your password has been updated successfully.">
        <Alert severity="success" sx={{ mb: 2 }}>
          Redirecting to login...
        </Alert>
      </AuthCard>
    );
  }

  const Footer = (
    <Typography variant="body2">
      Remember your password?{' '}
      <Link href="/login" underline="hover" fontWeight="500">
        Sign in
      </Link>
    </Typography>
  );

  return (
    <AuthCard title="Set New Password" description="Enter your new password below" footer={Footer}>
      {result?.serverError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {result.serverError}
        </Alert>
      )}

      <RNGForm
        schema={ResetPasswordSchema}
        uiSchema={resetPasswordFormConfig}
        defaultValues={{ password: '', confirmPassword: '' }}
        onSubmit={async (data) => {
          await runAction({
            oobCode,
            newPassword: data.password,
          });
        }}
        submitLabel="Reset Password"
        submitingLablel="Resetting..."
      />
    </AuthCard>
  );
}
