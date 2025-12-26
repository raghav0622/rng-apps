'use client';

import { useRNGAuth } from '@/core/auth/auth.context';
import { useOrg } from '@/core/organization/organization.context';
import { isAuthRoute } from '@/routes';
import Logo from '@/ui/Logo';
import DarkModeToggle from '@/ui/ThemeSwitch';
import { Dashboard, Menu as MenuIcon } from '@mui/icons-material';
import { AppBar, Box, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutContext } from './LayoutContext';

// Dynamic import prevents hydration mismatch for user-specific content
const UserMenu = dynamic(() => import('@/app/(protected)/UserMenu').then((mod) => mod.UserMenu), {
  ssr: false,
  loading: () => (
    <Box sx={{ width: 40, height: 40, bgcolor: 'action.hover', borderRadius: '50%' }} />
  ),
});

export default function AppHeader({ drawerDisabled = false }: { drawerDisabled?: boolean }) {
  // Consuming the updated Context
  const { handleDrawerToggle } = useLayoutContext();

  const { user } = useRNGAuth();
  const { org } = useOrg();
  const pathname = usePathname();
  const isAuthPage = isAuthRoute(pathname);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        // Ensure Header sits ABOVE the Drawer (Clipped Drawer pattern)
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar variant="dense" sx={{ gap: 1 }}>
        {/* MENU TOGGLE BUTTON 
           Visible on ALL screens (Mobile & Desktop) to support collapsible sidebar.
        */}
        {!drawerDisabled && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* LOGO */}
        <Logo />

        {/* ORG NAME (Desktop Only) */}
        {org?.name && (
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Box sx={{ borderLeft: 1, borderColor: 'divider', height: 24 }} />
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {org.name}
            </Typography>
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* RIGHT ACTIONS */}
        <Stack direction="row" spacing={1} alignItems="center">
          {pathname === '/profile' && (
            <Tooltip title="Go To Dashboard">
              <IconButton component={Link} href="/dashboard" color="inherit">
                <Dashboard />
              </IconButton>
            </Tooltip>
          )}

          <DarkModeToggle />

          {!isAuthPage && user && <UserMenu />}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
