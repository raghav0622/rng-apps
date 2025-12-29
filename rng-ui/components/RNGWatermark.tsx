'use client';

import * as React from 'react';
import { Box, Typography } from '@mui/material';

interface RNGWatermarkProps {
  /**
   * The text to display in the watermark.
   */
  text: string;
  /**
   * Opacity of the watermark.
   * @default 0.05
   */
  opacity?: number;
  children: React.ReactNode;
}

/**
 * 🎨 RNGWatermark
 * Overlays a repeating text pattern for sensitive data protection.
 */
export function RNGWatermark({ text, opacity = 0.05, children }: RNGWatermarkProps) {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Watermark Layer */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gridTemplateRows: 'repeat(auto-fill, minmax(200px, 1fr))',
          overflow: 'hidden',
        }}
      >
        {[...Array(20)].map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-45deg)',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'text.primary',
                opacity: opacity,
                fontWeight: 800,
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {text}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Content Layer */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
    </Box>
  );
}
