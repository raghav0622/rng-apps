'use client';

import { createSessionAction } from '@/features/auth/auth.actions';
import { SignupInput, SignupSchema } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { DEFAULT_LOGIN_REDIRECT } from '@/lib/routes';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Box, Link as MuiLink, Typography } from '@mui/material';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

export default function SignupPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { executeAsync, isExecuting } = useAction(createSessionAction);

  const handleSubmit = async (data: SignupInput) => {
    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        clientAuth,
        data.email,
        data.password,
      );

      // 2. Update Display Name in Firebase Auth (Best practice, though we sync manually too)
      await updateProfile(userCredential.user, { displayName: data.fullName });

      const idToken = await userCredential.user.getIdToken();

      // 3. Create Session AND Sync Profile
      // FIX: Pass fullName explicitly to ensure Firestore gets it immediately
      const result = await executeAsync({
        idToken,
        fullName: data.fullName,
      });

      if (result?.data?.success) {
        enqueueSnackbar('Account created successfully!', { variant: 'success' });
        window.location.href = DEFAULT_LOGIN_REDIRECT;
      }
    } catch (error: any) {
      const msg =
        error.code === 'auth/email-already-in-use'
          ? 'That email is already in use.'
          : error.message;
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  return (
    <>
      <RNGForm
        schema={SignupSchema}
        defaultValues={{ email: '', password: '', fullName: '' }}
        onSubmit={handleSubmit}
        title="Create Account"
        description="Get started with RNG App"
        submitLabel={isExecuting ? 'Creating Account...' : 'Sign Up'}
        uiSchema={[
          {
            name: 'fullName',
            type: 'text',
            label: 'Full Name',
          },
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
          Already have an account?{' '}
          <MuiLink component={Link} href="/login">
            Sign in
          </MuiLink>
        </Typography>
      </Box>
    </>
  );
}
