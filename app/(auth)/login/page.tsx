'use client';

import { LoginSchema } from '@/features/auth/auth.model';
import { useSignin } from '@/features/auth/hooks/useSignin';
import { RNGForm } from '@/rng-form';
import { AuthCard } from '@/ui/auth/AuthCard';
import { AuthNavigation } from '@/ui/auth/AuthNavigation';

export default function LoginPage() {
  const handleSubmit = useSignin();

  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in to your account"
      footer={<AuthNavigation mode="login" />}
    >
      <RNGForm
        schema={LoginSchema}
        defaultValues={{ email: '', password: '' }}
        onSubmit={handleSubmit}
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
    </AuthCard>
  );
}
