'use client';

import * as React from 'react';
import { GlobalStyles } from '@mui/material';

/**
 * 🎨 RNGScrollbar
 * Injects global styles for a consistent, modern scrollbar across all browsers.
 */
export function RNGScrollbar() {
  return (
    <GlobalStyles
      styles={(theme) => ({
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          },
        },
        // Firefox
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor:
            theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.2) transparent'
              : 'rgba(0,0,0,0.2) transparent',
        },
      })}
    />
  );
}
