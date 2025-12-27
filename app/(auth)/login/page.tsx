'use client';

import { loginAction } from '@/core/auth/auth.actions';
import { LoginSchema } from '@/core/auth/auth.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { AuthCard } from '@/ui/auth/AuthCard';

export default function LoginPage() {
  const { runAction } = useRNGServerAction(loginAction);

  return (
    <AuthCard title="Welcome Back" description="Sign in to your account" footer>
      <RNGForm
        schema={LoginSchema}
        uiSchema={[
          { label: 'Email', name: 'email', type: 'text', placeholder: 'you@example.com' },
          { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
        ]}
        onSubmit={async (data) => {
          await runAction(data);
        }}
        submitLabel="Sign In"
      />
    </AuthCard>
  );
}
