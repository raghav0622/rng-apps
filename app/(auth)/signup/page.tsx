'use client';

import { signUpAction } from '@/core/auth/auth.actions';
import { SignUpSchema } from '@/core/auth/auth.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AuthCard } from '@/ui/auth/AuthCard';
import { GoogleSignInButton } from '@/ui/auth/GoogleSignInButton';
import { Divider, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

const formConfig = defineForm<typeof SignUpSchema>((f) => [
  f.text('displayName', { label: 'Full Name', placeholder: 'John Doe' }),
  f.text('email', { label: 'Email Address', placeholder: 'you@example.com' }),
  f.password('password', { label: 'Password', description: 'At least 6 characters' }),
  f.password('confirmPassword', { label: 'Confirm Password' }),
]);

export default function SignupPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { runAction } = useRNGServerAction(signUpAction, {
    onSuccess: () => {
      enqueueSnackbar('Account created! Please log in.', { variant: 'success' });
      router.push('/login');
    },
  });

  return (
    <AuthCard
      title="Create Account"
      description="Start your journey with us"
      footer={
        <>
          Already have an account?{' '}
          <Link component={NextLink} href="/login" underline="hover">
            Log in
          </Link>
        </>
      }
    >
      <GoogleSignInButton />

      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      <RNGForm
        schema={SignUpSchema}
        uiSchema={formConfig}
        onSubmit={async (data) => {
          await runAction(data);
        }}
        submitLabel="Create Account"
      />
    </AuthCard>
  );
}
