'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext'; // <--- Import Auth Context
import { useOrg } from '@/features/orgs/components/OrgContext';
import { isAuthRoute } from '@/routes'; // <--- Import Route Helper
import { Dashboard, Menu as MenuIcon } from '@mui/icons-material';
import { AppBar, Box, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '../Logo';
import DarkModeToggle from '../ThemeSwitch';
import { useLayoutContext } from './LayoutContext';

// Dynamic import with SSR enabled prevents layout shift during hydration
const UserMenu = dynamic(() => import('@/ui/UserMenu').then((mod) => mod.UserMenu), {
  ssr: true,
});

export default function AppHeader({ drawerDisabled = false }: { drawerDisabled?: boolean }) {
  const { handleDrawerToggle } = useLayoutContext();
  const { user } = useRNGAuth(); // <--- Get User State
  const pathname = usePathname();
  const { org } = useOrg();
  const isAuthPage = isAuthRoute(pathname); // <--- Check if current page is Login/Signup

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
      <Toolbar variant="dense" sx={{ gap: 1 }}>
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

        <Box sx={{ ml: -1 }}>
          <Logo />
        </Box>

        {org?.name && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography textTransform="uppercase" variant="h6">
              {org.name}
            </Typography>
          </Box>
        )}
        <Box sx={{ flexGrow: 1 }}></Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {pathname === '/profile' && (
            <Tooltip title={'Go To Dashboard'}>
              <IconButton color="inherit" LinkComponent={Link} href="/dashboard">
                <Dashboard />
              </IconButton>
            </Tooltip>
          )}
          <DarkModeToggle />

          {/* Only show UserMenu if user is logged in AND not on an auth page */}
          {!isAuthPage && user && <UserMenu />}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
