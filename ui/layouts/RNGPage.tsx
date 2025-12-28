'use client';

import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface RNGPageProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function RNGPage({ title, description, actions, children }: RNGPageProps) {
  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" variant="body1">
              {description}
            </Typography>
          )}
        </Box>
        {actions && <Box>{actions}</Box>}
      </Box>
      {children}
    </Box>
  );
}
