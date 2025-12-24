'use client';

import { loginAction } from '@/core/auth/actions/auth.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Link } from '@mui/material';
import NextLink from 'next/link';
import { z } from 'zod';

// Define strict schema for the form
const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

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
