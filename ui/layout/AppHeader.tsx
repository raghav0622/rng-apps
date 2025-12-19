'use client';

import { Menu as MenuIcon } from '@mui/icons-material';
import { AppBar, Box, IconButton, Skeleton, Stack, Toolbar } from '@mui/material';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Logo from '../Logo';
import DarkModeToggle from '../ThemeSwitch';
import { useLayoutContext } from './LayoutContext';

// Dynamic import for UserMenu to reduce initial bundle size
const UserMenu = dynamic(() => import('./UserMenu').then((mod) => mod.UserMenu), {
  loading: () => <Skeleton variant="circular" width={32} height={32} animation="wave" />,
  ssr: true, // Enable SSR to show the skeleton or initial state faster
});

export default function AppHeader() {
  const { handleDrawerToggle } = useLayoutContext();

  return (
    <AppBar
      position="fixed"
      color="primary"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
          aria-label="open drawer"
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Logo />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <DarkModeToggle />
          {/* Suspense Boundary isolates UserMenu data fetching/loading */}
          <Suspense fallback={<Skeleton variant="circular" width={32} height={32} />}>
            <UserMenu />
          </Suspense>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
