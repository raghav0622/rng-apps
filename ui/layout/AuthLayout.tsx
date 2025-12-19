import { Box } from '@mui/material';
import * as React from 'react';
import AppHeader from './AppHeader';
import { useLayoutContext } from './LayoutContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { padding } = useLayoutContext();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Box
          component={'main'}
          sx={{
            display: 'flex',
            gap: padding,
            flexDirection: 'column',
            flexGrow: 1,
            p: padding,
            transition: 'ease-in-out 0.3s',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
