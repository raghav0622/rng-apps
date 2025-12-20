// ui/layout/UserMenu.tsx
'use client';

import { UserInSession } from '@/features/auth/auth.model';
import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { Logout, Person } from '@mui/icons-material';
import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// Helper to generate consistent initials
const getInitials = (displayName: string | null | undefined, email: string | null | undefined) => {
  if (displayName) {
    // Attempt to get first letter of first and last name
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
};

export function UserMenu() {
  const { user } = useRNGAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!user) return null;

  return (
    <AuthenticatedUserMenu
      user={user}
      anchorEl={anchorEl}
      open={open}
      onClick={handleClick}
      onClose={handleClose}
    />
  );
}

// Split component for cleaner rendering
interface AuthenticatedMenuProps {
  user: UserInSession;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  onClose: () => void;
}

function AuthenticatedUserMenu({ user, anchorEl, open, onClick, onClose }: AuthenticatedMenuProps) {
  const hasPhoto = Boolean(user.photoUrl);
  const initials = useMemo(
    () => getInitials(user.displayName, user.email),
    [user.displayName, user.email],
  );

  return (
    <>
      <Tooltip title="Account settings">
        <IconButton
          onClick={onClick}
          size="small"
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              position: 'relative',
              // Use theme color for text avatars, transparent for images
              bgcolor: hasPhoto ? 'transparent' : 'primary.main',
              fontSize: '0.875rem',
            }}
            alt={user.displayName || 'User'}
          >
            {!hasPhoto ? (
              initials
            ) : (
              <Image
                alt="User Avatar"
                src={user.photoUrl || ''}
                fill // makes the image fill the parent
                sizes="100vw"
                style={{ objectFit: 'cover' }} // controls cropping and scaling
              />
            )}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={onClose}
        onClick={onClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 200,
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
            <Avatar
              sx={{
                width: 32,
                height: 32,
                position: 'relative',
                // Use theme color for text avatars, transparent for images
                bgcolor: hasPhoto ? 'transparent' : 'primary.main',
                fontSize: '0.875rem',
              }}
              alt={user.displayName || 'User'}
            >
              {!hasPhoto ? (
                initials
              ) : (
                <Image
                  alt="User Avatar"
                  src={user.photoUrl || ''}
                  fill // makes the image fill the parent
                  sizes="100vw"
                  style={{ objectFit: 'cover' }} // controls cropping and scaling
                />
              )}
            </Avatar>
          </ListItemIcon>
          <Stack>
            <Typography variant="body2">{user.displayName}</Typography>
            <Typography variant="subtitle2">{user.email}</Typography>
          </Stack>
        </MenuItem>
        <MenuItem component={Link} href="/profile">
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />

        <MenuItem component={Link} href="/logout" sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
