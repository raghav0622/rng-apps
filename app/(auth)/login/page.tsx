'use client';

import { LoginSchema } from '@/features/auth/auth.model';
import { useSignin } from '@/features/auth/hooks/useSignin';
import { RNGForm } from '@/rng-form';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Link as MuiLink, Typography } from '@mui/material';
import Link from 'next/link';

export default function LoginPage() {
  const handleSubmit = useSignin();

  const Footer = (
    <>
      <Typography variant="body2" color="text.secondary">
        Don&apos;t have an account?{' '}
        <MuiLink component={Link} href="/signup" underline="hover" fontWeight="500">
          Sign up
        </MuiLink>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <MuiLink component={Link} href="/forgot-password" underline="hover" fontWeight="500">
          Forgot password?
        </MuiLink>
      </Typography>
    </>
  );

  return (
    <AuthCard title="Welcome Back" description="Sign in to your account" footer={Footer}>
      <RNGForm
        schema={LoginSchema}
        defaultValues={{ email: '', password: '' }}
        onSubmit={handleSubmit}
        // Removing internal title/desc as it's now handled by AuthCard
        submitingLablel="Signing in..." // Note: Fix typo in RNGForm prop if possible later: submittingLabel
        submitLabel="Sign In"
        uiSchema={[
          {
            name: 'email',
            type: 'text',
            label: 'Email Address',
            autoFocus: true,
            placeholder: 'you@example.com',
          },
          {
            name: 'password',
            type: 'password',
            label: 'Password',
          },
        ]}
      />
    </AuthCard>
  );
}
