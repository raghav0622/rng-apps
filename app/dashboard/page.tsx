'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { Typography } from '@mui/material';

export default function Page() {
  const auth = useAuth();
  return (
    <>
      <Typography>{auth.user?.email}</Typography>
    </>
  );
}
