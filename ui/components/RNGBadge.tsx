'use client';

import { Badge as MuiBadge, BadgeProps as MuiBadgeProps, styled } from '@mui/material';

interface RNGBadgeProps extends MuiBadgeProps {
  /**
   * The visual style of the badge.
   * - 'standard': Standard count (e.g. 5)
   * - 'dot': Small status dot
   * - 'tonal': Light background (matches RNGChip)
   */
  rngVariant?: 'standard' | 'dot' | 'tonal';
}

const StyledBadge = styled(MuiBadge, {
  shouldForwardProp: (prop) => prop !== 'rngVariant',
})<{ rngVariant: 'standard' | 'dot' | 'tonal' }>(({ theme, rngVariant, color = 'primary' }) => {
  if (rngVariant === 'tonal') {
    const paletteColor = (theme.palette[color as keyof typeof theme.palette] as any)?.main || theme.palette.primary.main;
    return {
      '& .MuiBadge-badge': {
        backgroundColor: (theme.palette[color as keyof typeof theme.palette] as any)?.light || theme.palette.primary.light,
        color: paletteColor,
        fontWeight: 700,
        boxShadow: 'none',
      },
    };
  }
  return {};
});

/**
 * 🎨 RNGBadge
 * Notification counters and status indicators with support for tonal enterprise styles.
 */
export function RNGBadge({ rngVariant = 'standard', sx, children, ...props }: RNGBadgeProps) {
  return (
    <StyledBadge
      rngVariant={rngVariant}
      variant={rngVariant === 'dot' ? 'dot' : 'standard'}
      sx={{ ...sx }}
      {...props}
    >
      {children}
    </StyledBadge>
  );
}
