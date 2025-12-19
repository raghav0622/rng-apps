'use client';

import { Box } from '@mui/material';
import * as React from 'react';
import AuthAppHeader from './AuthAppHeader';
import { useLayoutContext } from './LayoutContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { padding } = useLayoutContext();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <AuthAppHeader />
      <Box
        component={'main'}
        sx={{
          display: 'flex',
          gap: padding,
          flexDirection: 'column',
          flexGrow: 1,
          p: padding * 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
