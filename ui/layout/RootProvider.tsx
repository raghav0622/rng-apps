'use client';

import { AuthProvider } from '@/features/auth/components/AuthContext';
import { SessionUser } from '@/features/auth/session';
import { LayoutContextProvider } from '@/ui/layout/LayoutContext';
import theme from '@/ui/theme';
import { Close as CloseIcon } from '@mui/icons-material';
import { CssBaseline, IconButton, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { SnackbarKey, SnackbarProvider } from 'notistack';
import { useRef } from 'react';

interface RootProviderProps {
  children: React.ReactNode;
  sessionUser: SessionUser | null;
}

export function RootProvider({ children, sessionUser }: RootProviderProps) {
  // Ref to access notistack methods (like closeSnackbar)
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
          <AuthProvider initialUser={sessionUser}>
            <LayoutContextProvider>{children}</LayoutContextProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
