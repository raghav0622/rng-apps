'use client';

import { loginAction } from '@/core/auth/auth.actions';
import { LoginSchema } from '@/core/auth/auth.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Link } from '@mui/material';
import NextLink from 'next/link';

// Define the Form Layout (DSL)
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
      <RNGForm
        schema={LoginSchema}
        uiSchema={formConfig}
        onSubmit={async (data) => {
          await runAction(data);
        }}
        submitLabel="Sign In"
      />
    </AuthCard>
  );
}
