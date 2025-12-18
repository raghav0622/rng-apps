'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { SessionUser } from '@/lib/auth/session';
import theme from '@/ui/theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';

interface RootProviderProps {
  children: React.ReactNode;
  initialUser?: SessionUser | null; // <--- ADD THIS
}

export function RootProvider({ children, initialUser }: RootProviderProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
