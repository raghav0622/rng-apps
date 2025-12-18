'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { SessionUser } from '@/lib/auth/session';
import theme from '@/ui/theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { ThemeProvider } from '@mui/material/styles';
import NextTopLoader from 'nextjs-toploader';
import { SnackbarProvider } from 'notistack';
import * as React from 'react';

interface RootProviderProps {
  children: React.ReactNode;
  sessionUser: SessionUser | null;
}

export default function RootProvider({ children, sessionUser }: RootProviderProps) {
  return (
    <>
      <InitColorSchemeScript attribute="class" />
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NextTopLoader color={theme.palette.primary.main} showSpinner={false} />

          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            autoHideDuration={4000}
          >
            {/* We pass the server-verified user here */}
            <AuthProvider initialUser={sessionUser}>{children}</AuthProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </>
  );
}
