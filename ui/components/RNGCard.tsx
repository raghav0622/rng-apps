'use client';

import { Box, Card as MuiCard, CardContent, CardProps, Divider, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface RNGCardProps extends CardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function RNGCard({ title, actions, children, ...props }: RNGCardProps) {
  return (
    <MuiCard variant="outlined" {...props}>
      {(title || actions) && (
        <>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'action.hover',
            }}
          >
            {title && (
              <Typography variant="subtitle1" fontWeight={600}>
                {title}
              </Typography>
            )}
            {actions && <Box>{actions}</Box>}
          </Box>
          <Divider />
        </>
      )}
      <CardContent>{children}</CardContent>
    </MuiCard>
  );
}
