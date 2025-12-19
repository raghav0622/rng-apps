'use client';

import { AuthProvider } from '@/features/auth/components/AuthContext';
import { SessionUser } from '@/features/auth/session';
import { LayoutContextProvider } from '@/ui/layout/LayoutContext';
import theme from '@/ui/theme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'; // Ensure correct version import
import { SnackbarProvider } from 'notistack';

interface RootProviderProps {
  children: React.ReactNode;
  sessionUser: SessionUser | null; // New Prop
}

export function RootProvider({ children, sessionUser }: RootProviderProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Fixes broken browser default styles */}
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <AuthProvider initialUser={sessionUser}>
            <LayoutContextProvider>{children}</LayoutContextProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
