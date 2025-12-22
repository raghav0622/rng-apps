'use client';

import { ResetPasswordSchema } from '@/features/auth/auth.model';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Alert, Box, Card, CardContent, CardHeader, Link, Typography } from '@mui/material';
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
      <Card>
        <CardContent>
          <Alert severity="success">Password reset successfully! Redirecting to login...</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Reset Password" subheader="Enter your new password below" />
      <CardContent>
        {result?.serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
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

        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Remember your password?{' '}
            <Link href="/login" underline="hover">
              Sign in
            </Link>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
