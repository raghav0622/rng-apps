'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { EmailVerificationBanner } from '@/features/auth/components/EmailVerificationBanner';
import { Typography } from '@mui/material';

export default function Page() {
  const { user } = useRNGAuth();
  return (
    <>
      <EmailVerificationBanner />
      <Typography variant="h6">{user?.displayName}</Typography>
    </>
  );
}
