'use client';

import { useLayoutContext } from '@/app/(protected)/LayoutContext';
import {
  Business as BusinessIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon, // ✅ Import Icon
} from '@mui/icons-material';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
  { label: 'Entities', icon: <PeopleIcon />, href: '/entities' }, // ✅ Added Link
  { label: 'Organization', icon: <BusinessIcon />, href: '/organization' },
];

export default function AppDrawer() {
  const { drawerOpen, mobile, handleDrawerClose, handleDrawerTransitionEnd, drawerWidth } =
    useLayoutContext();

  const pathname = usePathname();

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar variant="dense" /> {/* Spacer for Header */}
      <Divider />
      <List component="nav" sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {MENU_ITEMS.map((item) => {
          // Highlight if current path starts with the menu href (e.g. /entities/123)
          const isActive = pathname.startsWith(item.href);
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                onClick={mobile ? handleDrawerClose : undefined}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={mobile ? 'temporary' : 'persistent'}
      open={drawerOpen}
      onTransitionEnd={handleDrawerTransitionEnd}
      onClose={handleDrawerClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          borderRight: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
