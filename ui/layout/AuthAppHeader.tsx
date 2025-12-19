'use client'; // Ensure client directive is here as we use hooks

import { AppBar, Toolbar } from '@mui/material';
import * as React from 'react';
import Logo from '../Logo';
import DarkModeToggle from '../ThemeSwitch';

const AuthAppHeader: React.FC = () => {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense">
        <Logo />
        <div style={{ flex: 1 }} />
        <DarkModeToggle />
      </Toolbar>
    </AppBar>
  );
};

export default AuthAppHeader;
