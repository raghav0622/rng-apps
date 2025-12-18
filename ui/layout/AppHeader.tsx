'use client'; // Ensure client directive is here as we use hooks

import { Menu as MenuIcon } from '@mui/icons-material';
import { AppBar, IconButton, Toolbar } from '@mui/material';
import * as React from 'react';
import Logo from '../Logo';
import DarkModeToggle from '../ThemeSwitch';
import { useLayoutContext } from './LayoutContext';
import { UserMenu } from './UserMenu'; // Import the new component

const AppHeader: React.FC = () => {
  const { handleDrawerToggle } = useLayoutContext();
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense">
        <IconButton
          onClick={handleDrawerToggle}
          color="inherit"
          edge="start"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Logo />
        <div style={{ flex: 1 }} />
        <DarkModeToggle />
        <UserMenu />
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
