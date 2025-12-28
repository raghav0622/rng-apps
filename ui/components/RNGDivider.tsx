'use client';

import * as React from 'react';
import { Divider as MuiDivider, DividerProps as MuiDividerProps, Typography, Box } from '@mui/material';

interface RNGDividerProps extends MuiDividerProps {
  /**
   * Optional text label to show in the center or left of the divider
   */
  label?: string;
  /**
   * Alignment of the label
   */
  labelAlign?: 'left' | 'center' | 'right';
}

/**
 * 🎨 RNGDivider
 * Enhanced divider with support for text labels and better vertical integration.
 */
export function RNGDivider({ label, labelAlign = 'center', children, sx, ...props }: RNGDividerProps) {
  if (label || children) {
    return (
      <MuiDivider textAlign={labelAlign} sx={{ my: 2, ...sx }} {...props}>
        {label ? (
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            {label}
          </Typography>
        ) : (
          children
        )}
      </MuiDivider>
    );
  }

  return <MuiDivider sx={{ my: 2, ...sx }} {...props} />;
}
