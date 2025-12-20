'use client';

import { Dashboard, Menu as MenuIcon } from '@mui/icons-material';
import { AppBar, Box, IconButton, Skeleton, Stack, Toolbar, Tooltip } from '@mui/material';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '../Logo';
import DarkModeToggle from '../ThemeSwitch';
import { useLayoutContext } from './LayoutContext';
// Dynamic import with SSR enabled prevents layout shift during hydration
const UserMenu = dynamic(
  () => import('../../features/auth/components/UserMenu').then((mod) => mod.UserMenu),
  {
    loading: () => <Skeleton variant="circular" width={32} height={32} animation="wave" />,
    ssr: true,
  },
);

export default function AppHeader({ drawerDisabled = false }: { drawerDisabled?: boolean }) {
  const { handleDrawerToggle } = useLayoutContext();
  const pathname = usePathname();
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar variant="dense">
        {!!drawerDisabled && (
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
            aria-label="open drawer"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Logo />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {pathname === '/profile' && (
            <Tooltip title={'Go To Dashboard'}>
              <IconButton color="inherit" LinkComponent={Link} href="/dashboard">
                <Dashboard />
              </IconButton>
            </Tooltip>
          )}
          <DarkModeToggle />
          <UserMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
