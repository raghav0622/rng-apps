'use client';

import { logoutAction } from '@/features/auth/auth.actions';
import { useUserProfile } from '@/features/auth/components/UserProfileContext'; // [CHANGED]
import { Logout, Person, Settings } from '@mui/icons-material';
import { Avatar, Divider, IconButton, ListItemIcon, Menu, MenuItem, Skeleton } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

export function UserMenu() {
  // [CHANGED] Use the profile context instead of raw auth
  const { data: user, isLoading } = useUserProfile();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logoutAction();
  };

  // [ADDITION] Prevent rendering broken state while loading
  if (isLoading && !user) {
    return <Skeleton variant="circular" width={32} height={32} />;
  }

  if (!user) return null;

  const hasPhoto = Boolean(user.photoURL && user.photoURL.length > 0);
  const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          sx={{ width: 32, height: 32, bgcolor: hasPhoto ? 'transparent' : 'primary.main' }}
          src={user.photoURL || ''}
          alt={user.displayName || 'User'}
        >
          {!hasPhoto && initial}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
      >
        <MenuItem component={Link} href="/dashboard/profile">
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>

        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
