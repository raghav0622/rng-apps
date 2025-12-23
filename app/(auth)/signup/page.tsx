'use client';

import { SignupSchema } from '@/features/auth/auth.model';
import { useSignup } from '@/features/auth/hooks/useSignup';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { AuthCard } from '@/ui/auth/AuthCard';
import { Link as MuiLink, Typography } from '@mui/material';
import Link from 'next/link';

export default function SignupPage() {
  const handleSubmit = useSignup();

  const Footer = (
    <Typography variant="body2" color="text.secondary">
      Already have an account?{' '}
      <MuiLink component={Link} href="/login" underline="hover" fontWeight="500">
        Sign in
      </MuiLink>
    </Typography>
  );

  return (
    <AuthCard title="Create Account" description="Get started with RNG App" footer={Footer}>
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
