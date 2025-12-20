'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { Typography } from '@mui/material';

export default function Page() {
  const { user } = useRNGAuth();
  return (
    <>
      <Typography variant="h6">{user?.displayName}</Typography>
    </>
  );
}
