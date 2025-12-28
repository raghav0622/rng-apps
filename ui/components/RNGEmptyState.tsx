'use client';

import { Box, Button, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface RNGEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function RNGEmptyState({ icon, title, description, action }: RNGEmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        p: 4,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      {icon && <Box sx={{ mb: 2 }}>{icon}</Box>}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
