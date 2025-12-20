'use client';

import { LayoutContextProvider } from '@/ui/layout/LayoutContext';
import theme from '@/ui/theme';
import { Close as CloseIcon } from '@mui/icons-material';
import { Box, CssBaseline, IconButton, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { SnackbarKey, SnackbarProvider } from 'notistack';
import { useRef } from 'react';

interface RootProviderProps {
  children: React.ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  const snackbarRef = useRef<SnackbarProvider>(null);

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Fixes broken browser default styles */}
        <SnackbarProvider
          ref={snackbarRef}
          maxSnack={3}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          // Global action to make all snackbars closable
          action={(key: SnackbarKey) => (
            <IconButton
              onClick={() => snackbarRef.current?.closeSnackbar(key)}
              size="small"
              color="inherit"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        >
          <LayoutContextProvider>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                bgcolor: 'background.default',
              }}
            >
              {children}
            </Box>
          </LayoutContextProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
