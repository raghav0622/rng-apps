'use client';

import { useAuth } from '@/features/auth/components/AuthContext';
import { Menu as MenuIcon } from '@mui/icons-material';
import { AppBar, Box, CircularProgress, IconButton, Toolbar } from '@mui/material';
import * as React from 'react';
import { Suspense, lazy } from 'react';
import Logo from '../Logo';
import DarkModeToggle from '../ThemeSwitch';
import { useLayoutContext } from './LayoutContext';

// Lazy load the user menu to improve initial render performance
const UserMenu = lazy(() => import('./UserMenu').then((module) => ({ default: module.UserMenu })));

const AppHeader: React.FC = () => {
  const { handleDrawerToggle } = useLayoutContext();
  const { user } = useAuth();

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense">
        {user && (
          <IconButton
            onClick={handleDrawerToggle}
            color="inherit"
            edge="start"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Logo />
        <div style={{ flex: 1 }} />
        <DarkModeToggle />

        <Box sx={{ ml: 1 }}>
          <Suspense fallback={<CircularProgress size={24} color="inherit" />}>
            <UserMenu />
          </Suspense>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
