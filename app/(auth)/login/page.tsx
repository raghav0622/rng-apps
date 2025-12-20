'use client';
import Link from 'next/link';

import { LoginSchema } from '@/features/auth/auth.model';
import { useSignin } from '@/features/auth/hooks/useSignin';
import { RNGForm } from '@/rng-form';
import { Box, Link as MuiLink, Typography } from '@mui/material';

export default function LoginPage() {
  const handleSubmit = useSignin();

  return (
    <>
      <RNGForm
        schema={LoginSchema}
        defaultValues={{ email: '', password: '' }}
        onSubmit={handleSubmit}
        title="Welcome Back"
        description="Sign in to your account"
        submitingLablel="Signing in..."
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
      <Box sx={{ mt: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
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
      </Box>
    </>
  );
}
