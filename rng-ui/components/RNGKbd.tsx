'use client';

import { Box, Typography } from '@mui/material';
import React from 'react';

interface RNGKbdProps {
  /**
   * The keys to display.
   * Use '+' to separate keys (e.g., "Ctrl + K").
   */
  shortcut: string;
}

/**
 * 🎨 RNGKbd
 * Renders a stylized keyboard shortcut hint.
 */
export function RNGKbd({ shortcut }: RNGKbdProps) {
  const keys = shortcut.split('+').map((k) => k.trim());

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <Box
            component="kbd"
            sx={{
              display: 'inline-block',
              padding: '2px 6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              lineHeight: 1,
              color: 'text.secondary',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '4px',
              boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
              minWidth: '20px',
              textAlign: 'center',
            }}
          >
            {key}
          </Box>
          {index < keys.length - 1 && (
            <Typography variant="caption" color="text.disabled">
              +
            </Typography>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}
