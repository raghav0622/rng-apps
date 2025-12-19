'use client';

import { AuthProvider } from '@/features/auth/components/AuthContext';
import { UserProfileProvider } from '@/features/auth/components/UserProfileContext'; // [ADDITION]
import { SessionUser } from '@/features/auth/session';
import { LayoutContextProvider } from '@/ui/layout/LayoutContext';
import theme from '@/ui/theme';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import DashboardLayout from './DashboardLayout';

export function RootProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <LayoutContextProvider>
            <AuthProvider initialUser={initialUser}>
              {/* [ADDITION] Wrap Layout with UserProfileProvider */}
              <UserProfileProvider>
                <DashboardLayout>{children}</DashboardLayout>
              </UserProfileProvider>
            </AuthProvider>
          </LayoutContextProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
