'use client';

import { RNGForm } from '@/rng-form';
import { AuthCard } from '@/ui/auth/AuthCard';
import { LoadingSpinner } from '@/ui/LoadingSpinner';
import { Box, Button } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useFirebaseClientAuth } from '../hooks/useFirebaseClientAuth';

const ResetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

interface ResetPasswordFormProps {
  oobCode: string;
}

export function ResetPasswordForm({ oobCode }: ResetPasswordFormProps) {
  const router = useRouter();
  const { verifyResetCode, confirmReset } = useFirebaseClientAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyResetCode(oobCode)
      .then((email) => {
        setEmail(email);
        setIsVerifying(false);
      })
      .catch(() => {
        setError('This password reset link is invalid or has expired.');
        setIsVerifying(false);
      });
  }, [oobCode, verifyResetCode]);

  const handleReset = async (data: z.infer<typeof ResetSchema>) => {
    try {
      await confirmReset(oobCode, data.password);
      router.push('/login?message=Password updated successfully');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to reset password');
    }
  };

  if (isVerifying) return <LoadingSpinner message="Verifying link..." />;

  if (error) {
    return (
      <AuthCard title="Invalid Link" description={error}>
        <Box textAlign="center" mt={2}>
          <Button component={Link} href="/forgot-password">
            Request New Link
          </Button>
        </Box>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset Password" description={`Set a new password for ${email}`}>
      <RNGForm
        schema={ResetSchema}
        defaultValues={{ password: '', confirmPassword: '' }}
        onSubmit={handleReset}
        submitLabel="Change Password"
        uiSchema={[
          { name: 'password', type: 'password', label: 'New Password' },
          { name: 'confirmPassword', type: 'password', label: 'Confirm Password' },
        ]}
      />
    </AuthCard>
  );
}
