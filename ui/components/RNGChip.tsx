'use client';

import { Chip as MuiChip, ChipProps as MuiChipProps, alpha, styled } from '@mui/material';
import { ReactElement } from 'react';

/**
 * 🎨 RNGChip Status Types
 */
export type RNGStatusVariant = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' | 'neutral';

interface RNGChipProps extends Omit<MuiChipProps, 'color' | 'variant'> {
  /**
   * The semantic status of the chip.
   * Maps to theme palette colors.
   */
  status?: RNGStatusVariant;
  /**
   * Visual style: 
   * - 'filled': Solid background (MUI default)
   * - 'outlined': Bordered (MUI default)
   * - 'tonal': Light background with dark text (Enterprise standard)
   */
  variant?: 'filled' | 'outlined' | 'tonal';
  /**
   * Optional icon to show at the start.
   */
  icon?: ReactElement;
}

const StyledChip = styled(MuiChip, {
  shouldForwardProp: (prop) => prop !== 'status' && prop !== 'rngVariant',
})<{ status: RNGStatusVariant; rngVariant: 'filled' | 'outlined' | 'tonal' }>(({ theme, status, rngVariant }) => {
  const color = status === 'neutral' ? theme.palette.text.secondary : (theme.palette[status as keyof typeof theme.palette] as any)?.main || theme.palette.primary.main;
  const lightColor = status === 'neutral' ? theme.palette.action.hover : (theme.palette[status as keyof typeof theme.palette] as any)?.light || theme.palette.primary.light;

  if (rngVariant === 'tonal') {
    return {
      backgroundColor: alpha(color, 0.12),
      color: color,
      fontWeight: 700,
      border: 'none',
      '& .MuiChip-icon': {
        color: 'inherit',
      },
      '& .MuiChip-deleteIcon': {
        color: alpha(color, 0.5),
        '&:hover': {
          color: color,
        },
      },
    };
  }

  return {};
});

/**
 * 🎨 RNGChip
 * A versatile status indicator and tag component.
 * Optimized for ERP "Status" columns and data categorization.
 */
export function RNGChip({ status = 'primary', variant = 'tonal', sx, ...props }: RNGChipProps) {
  // Map RNG status to MUI color for standard variants
  let muiColor: MuiChipProps['color'] = 'default';
  if (status !== 'neutral' && status !== 'tonal') {
    muiColor = status as MuiChipProps['color'];
  }

  return (
    <StyledChip
      status={status}
      rngVariant={variant}
      color={muiColor}
      variant={variant === 'tonal' ? 'filled' : variant}
      sx={{
        height: 24,
        fontSize: '0.75rem',
        borderRadius: '6px',
        ...sx,
      }}
      {...props}
    />
  );
}
