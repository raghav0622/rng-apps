'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { UserProfileProvider } from '@/lib/auth/UserProfileContext'; // [ADDITION]
import { LayoutContextProvider } from '@/ui/layout/LayoutContext';
import theme from '@/ui/theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <AuthProvider>
            {/* [ADDITION] Wrap Layout with UserProfileProvider */}
            <UserProfileProvider>
              <LayoutContextProvider>{children}</LayoutContextProvider>
            </UserProfileProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
