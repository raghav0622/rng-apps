'use client';

import { Menu as MenuIcon } from '@mui/icons-material';
import { AppBar, Box, IconButton, Skeleton, Stack, Toolbar } from '@mui/material';
import dynamic from 'next/dynamic';
import Logo from '../Logo';
import DarkModeToggle from '../ThemeSwitch';
import { useLayoutContext } from './LayoutContext';

// Dynamic import with SSR enabled prevents layout shift during hydration
const UserMenu = dynamic(() => import('./UserMenu').then((mod) => mod.UserMenu), {
  loading: () => <Skeleton variant="circular" width={32} height={32} animation="wave" />,
  ssr: true,
});

export default function AppHeader() {
  const { handleDrawerToggle } = useLayoutContext();

  return (
    <AppBar
      position="fixed"
      color="inherit" // Better for dark/light mode switching than 'primary'
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper', // Ensures it respects theme background
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
          <UserMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
