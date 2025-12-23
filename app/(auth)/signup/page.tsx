'use client';

import { SignupSchema } from '@/features/auth/auth.model';
import { useSignup } from '@/features/auth/hooks/useSignup';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { AuthCard } from '@/ui/auth/AuthCard';
import { AuthNavigation } from '@/ui/auth/AuthNavigation';

export default function SignupPage() {
  const handleSubmit = useSignup();

  return (
    <AuthCard
      title="Create Account"
      description="Get started with RNG App"
      footer={<AuthNavigation mode="signup" />}
    >
      <RNGForm
        schema={SignupSchema}
        defaultValues={{ email: '', password: '', displayName: '' }}
        onSubmit={handleSubmit}
        submitingLablel="Creating Account..."
        submitLabel="Sign Up"
        uiSchema={[
          { name: 'displayName', type: 'text', label: 'Full Name', autoFocus: true },
          { name: 'email', type: 'text', label: 'Email Address' },
          { name: 'password', type: 'password', label: 'Password' },
        ]}
      />
    </AuthCard>
  );
}
