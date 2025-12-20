'use client';

import { createSessionAction, signupAction } from '@/features/auth/auth.actions';
import { SignupInput, SignupSchema } from '@/features/auth/auth.model';
import { clientAuth } from '@/lib/firebase/client';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Box, Link as MuiLink, Typography } from '@mui/material';
import { signInWithCustomToken } from 'firebase/auth';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

export default function SignupPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { executeAsync, isExecuting, hasErrored } = useAction(signupAction);
  const { executeAsync: createSession } = useAction(createSessionAction);
  const router = useRouter();
  const handleSubmit = async (data: SignupInput) => {
    const customToken = await executeAsync(data);

    if (customToken.data?.success) {
      const customTokens = await signInWithCustomToken(clientAuth, customToken.data.data);

      const idToken = (await customTokens.user.getIdTokenResult()).token;

      await createSession({
        idToken,
      });
    }

    enqueueSnackbar('Account created successfully!', { variant: 'success' });

    router.refresh();
  };

  return (
    <>
      <RNGForm
        schema={SignupSchema}
        defaultValues={{ email: '', password: '', displayName: '' }}
        onSubmit={handleSubmit}
        title="Create Account"
        description="Get started with RNG App"
        submitLabel={isExecuting ? 'Creating Account...' : 'Sign Up'}
        uiSchema={[
          {
            name: 'displayName',
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
