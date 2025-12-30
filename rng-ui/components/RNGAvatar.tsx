'use client';

import { Avatar as MuiAvatar, AvatarProps as MuiAvatarProps, Badge, styled } from '@mui/material';

/**
 * 🎨 RNGAvatar Status
 */
export type RNGUserStatus = 'online' | 'busy' | 'away' | 'offline';

interface RNGAvatarProps extends MuiAvatarProps {
  /**
   * Shows a status dot (e.g., online/offline).
   */
  status?: RNGUserStatus;
  /**
   * Sizing shorthand in pixels.
   * @default 40
   */
  size?: number;
}

const StyledBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: RNGUserStatus }>(({ theme, status }) => {
  let color = theme.palette.grey[400];
  if (status === 'online') color = theme.palette.success.main;
  if (status === 'busy') color = theme.palette.error.main;
  if (status === 'away') color = theme.palette.warning.main;

  return {
    '& .MuiBadge-badge': {
      backgroundColor: color,
      color: color,
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': status === 'online' ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      } : {},
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0,
      },
    },
  };
});

/**
 * 🎨 RNGAvatar
 * User or entity representation with presence indicators.
 * Built-in support for online/offline status with "Live" ripple effect.
 */
export function RNGAvatar({ status, size = 40, sx, children, ...props }: RNGAvatarProps) {
  const avatar = (
    <MuiAvatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 600,
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiAvatar>
  );

  if (status) {
    return (
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        status={status}
      >
        {avatar}
      </StyledBadge>
    );
  }

  return avatar;
}
