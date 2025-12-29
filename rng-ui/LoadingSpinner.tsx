'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100%',
        }}
      >
        <CircularProgress size={48} thickness={4} />
        {message && (
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <CircularProgress size={24} />
      {message && (
        <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
