'use client';

import { createSessionAction } from '@/features/auth/auth.actions';
import { LoginInput, LoginSchema } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { FormError } from '@/rng-form';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { Box, Link as MuiLink, Typography } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

export default function LoginPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // Hook for the server action
  const { executeAsync, isExecuting } = useAction(createSessionAction);

  const handleSubmit = async (data: LoginInput) => {
    try {
      // 1. Authenticate with Firebase Client SDK
      const userCredential = await signInWithEmailAndPassword(
        clientAuth,
        data.email,
        data.password,
      );
      const idToken = await userCredential.user.getIdToken();

      // 2. Exchange token for Session Cookie via Server Action
      const result = await executeAsync({ idToken });

      if (result?.data?.success) {
        enqueueSnackbar('Login successful! Redirecting...', { variant: 'success' });
        // Use full page reload to ensure all server components receive the new cookie immediately
        window.location.href = DEFAULT_LOGIN_REDIRECT;
      } else {
        enqueueSnackbar('Failed to create secure session.', { variant: 'error' });
      }
    } catch (error: any) {
      // Firebase Client Error Handling
      let msg = error.message;
      if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found') msg = 'Account not found.';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';

      enqueueSnackbar(msg, { variant: 'error' });
      throw new FormError(msg);
    }
  };

  return (
    <>
      <RNGForm
        schema={LoginSchema}
        defaultValues={{ email: '', password: '' }}
        onSubmit={handleSubmit}
        title="Welcome Back"
        description="Sign in to your account"
        submitLabel={isExecuting ? 'Signing in...' : 'Sign In'}
        uiSchema={[
          {
            name: 'email',
            type: 'text',
            label: 'Email Address',
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
          Forgot Your Password?{' '}
          <MuiLink component={Link} href="/forgot-password" underline="hover" fontWeight="500">
            Reset Password
          </MuiLink>
        </Typography>
      </Box>
    </>
  );
}
