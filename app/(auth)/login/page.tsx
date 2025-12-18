'use client';

import { createSessionAction } from '@/features/auth/auth.actions';
import { LoginInput, LoginSchema } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { DEFAULT_LOGIN_REDIRECT } from '@/lib/routes';
import { FormError } from '@/rng-form';
import { RNGForm } from '@/rng-form/components/RNGForm';
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
        enqueueSnackbar('Login successful!', { variant: 'success' });
        // Hard refresh to ensure middleware picks up the new cookie
        window.location.href = DEFAULT_LOGIN_REDIRECT;
      } else {
        enqueueSnackbar('Failed to create session.', { variant: 'error' });
      }
    } catch (error: any) {
      // Firebase Client Error Handling
      const msg =
        error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : error.message;
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
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2">
          Don&apos;t have an account?{' '}
          <MuiLink component={Link} href="/signup">
            Sign up
          </MuiLink>
        </Typography>
        <Typography variant="body2">
          Frogot Your Password?{' '}
          <MuiLink component={Link} href="/forgot-password">
            Reset Pasword
          </MuiLink>
        </Typography>
      </Box>
    </>
  );
}
