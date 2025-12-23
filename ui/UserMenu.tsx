'use client';

import { UserInSession } from '@/features/auth/auth.model';
import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { getInitials } from '@/features/auth/utils/user.utils'; // Imported utility
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

export function UserMenu() {
  const { user } = useRNGAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (user)
    return (
      <AuthenticatedUserMenu
        user={user}
        anchorEl={anchorEl}
        open={open}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        onClose={() => setAnchorEl(null)}
      />
    );

  return null;
}

interface AuthenticatedMenuProps {
  user: UserInSession;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  onClose: () => void;
}

function AuthenticatedUserMenu({ user, anchorEl, open, onClick, onClose }: AuthenticatedMenuProps) {
  const hasPhoto = Boolean(user.photoUrl);
  // Logic extracted to shared utility
  const initials = useMemo(
    () => getInitials(user.displayName, user.email),
    [user.displayName, user.email],
  );

  const UserAvatar = (
    <Avatar
      sx={{
        width: 32,
        height: 32,
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
          fill
          sizes="32px"
          style={{ objectFit: 'cover' }}
        />
      )}
    </Avatar>
  );

  return (
    <>
      <Tooltip title="Account settings">
        <IconButton
          onClick={onClick}
          size="small"
          aria-controls={open ? 'account-menu' : undefined}
        >
          {UserAvatar}
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
            },
          },
        }}
      >
        <MenuItem component={Link} href="/profile">
          <ListItemIcon>{UserAvatar}</ListItemIcon>
          <Stack>
            <Typography variant="body2">{user.displayName}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {user.email}
            </Typography>
          </Stack>
        </MenuItem>

        <Divider />

        <MenuItem component={Link} href="/profile">
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>

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
