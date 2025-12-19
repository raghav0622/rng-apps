'use client';

import { Menu as MenuIcon } from '@mui/icons-material';
import { AppBar, Box, IconButton, Skeleton, Stack, Toolbar } from '@mui/material';
import dynamic from 'next/dynamic';
import { Suspense } from 'react'; // Use React Suspense
import Logo from '../Logo';
import DarkModeToggle from '../ThemeSwitch';
import { useLayoutContext } from './LayoutContext';

// Dynamic import with no SSR option if it relies purely on browser APIs,
// otherwise let it hydrate. Using a loading skeleton here is key.
const UserMenu = dynamic(() => import('./UserMenu').then((mod) => mod.UserMenu), {
  loading: () => <Skeleton variant="circular" width={40} height={40} animation="wave" />,
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
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Logo />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <DarkModeToggle />
          {/* Suspense Boundary for User Menu */}
          <Suspense fallback={<Skeleton variant="circular" width={40} height={40} />}>
            <UserMenu />
          </Suspense>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
