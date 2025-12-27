'use client';

import { loginAction, requestMagicLinkAction } from '@/core/auth/auth.actions';
import { LoginSchema } from '@/core/auth/auth.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Alert, Box, Divider, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useState } from 'react';

const formConfig = defineForm<typeof LoginSchema>((f) => [
  f.text('email', {
    label: 'Email Address',
    placeholder: 'you@example.com',
  }),
  f.password('password', {
    label: 'Password',
    placeholder: '••••••••',
  }),
]);

export default function LoginPage() {
  const { runAction } = useRNGServerAction(loginAction);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [email, setEmail] = useState('');

  const magicLinkAction = useRNGServerAction(requestMagicLinkAction, {
    onSuccess: () => setMagicLinkSent(true),
  });

  const handleMagicLink = async () => {
    if (!email) return;
    await magicLinkAction.runAction({ email });
  };

  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in to your account"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link component={NextLink} href="/signup" underline="hover">
            Sign up
          </Link>{' '}
          |{' '}
          <Link component={NextLink} href="/forgot-password" underline="hover">
            Forgot Password?
          </Link>
        </>
      }
    >
      {magicLinkSent && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Magic link sent! Check your email to sign in.
        </Alert>
      )}

      {/* Google Sign In Button Removed */}
      {/* <GoogleSignInButton /> */}

      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      <RNGForm
        schema={LoginSchema}
        uiSchema={formConfig}
        onValuesChange={(vals) => setEmail(vals.email || '')}
        onSubmit={async (data) => {
          await runAction(data);
        }}
        submitLabel="Sign In"
      />

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link
          component="button"
          variant="body2"
          onClick={handleMagicLink}
          disabled={magicLinkAction.isExecuting || !email}
          sx={{ cursor: 'pointer' }}
        >
          {magicLinkAction.isExecuting ? 'Sending...' : 'Sign in with Magic Link'}
        </Link>
      </Box>
    </AuthCard>
  );
}
