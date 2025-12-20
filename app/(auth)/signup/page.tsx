'use client';
import { SignupSchema } from '@/features/auth/auth.model';
import { useSignup } from '@/features/auth/hooks/useSignup';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Box, Link as MuiLink, Typography } from '@mui/material';
import Link from 'next/link';

export default function SignupPage() {
  const handleSubmit = useSignup();

  return (
    <>
      <RNGForm
        schema={SignupSchema}
        defaultValues={{ email: '', password: '', displayName: '' }}
        onSubmit={handleSubmit}
        title="Create Account"
        description="Get started with RNG App"
        submitingLablel={'Creating Account...'}
        submitLabel="Sign Up"
        uiSchema={[
          {
            name: 'displayName',
            type: 'text',
            label: 'Full Name',
            autoFocus: true,
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
