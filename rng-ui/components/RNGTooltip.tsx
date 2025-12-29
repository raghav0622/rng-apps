'use client';

import * as React from 'react';
import { 
  Tooltip as MuiTooltip, 
  TooltipProps as MuiTooltipProps, 
  styled, 
  tooltipClasses 
} from '@mui/material';

interface RNGTooltipProps extends MuiTooltipProps {
  /**
   * Visual variant
   */
  rngVariant?: 'standard' | 'rich';
}

const StyledTooltip = styled(({ className, ...props }: MuiTooltipProps) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[8],
    padding: '12px 16px',
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    maxWidth: 320,
    fontSize: theme.typography.pxToRem(12),
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.paper,
    '&::before': {
      border: `1px solid ${theme.palette.divider}`,
    }
  },
}));

/**
 * 🎨 RNGTooltip
 * Enhanced tooltip with support for rich content, clean borders, and better shadows.
 */
export function RNGTooltip({ rngVariant = 'standard', children, ...props }: RNGTooltipProps) {
  if (rngVariant === 'rich') {
    return (
      <StyledTooltip {...props}>
        {children}
      </StyledTooltip>
    );
  }

  return (
    <MuiTooltip arrow {...props}>
      {children}
    </MuiTooltip>
  );
}
