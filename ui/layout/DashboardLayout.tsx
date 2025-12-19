'use client';

import { useAuth } from '@/features/auth/components/AuthContext';
import { LoadingSpinner } from '@/ui/shared/LoadingSpinner';
import { Box } from '@mui/material';
import React, { Suspense, lazy } from 'react';
import { AppContent } from './AppContent';
import AppDrawer from './AppDrawer';
import AppHeader from './AppHeader';

// Lazy load heavy navigation components to improve TTI (Time to Interactive)
const DrawerContent = lazy(() => import('../DrawerContent'));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isInitialized: authInitialized, loading: authLoading } = useAuth();

  // Prevents "Flicker": Wait for Auth to confirm state before showing Layout.
  // If we have a server session, authInitialized is true immediately.
  if (!authInitialized || authLoading) {
    return <LoadingSpinner fullScreen message="Authenticating..." />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <AppHeader />

      <AppDrawer>
        <Suspense fallback={<LoadingSpinner />}>
          <DrawerContent />
        </Suspense>
      </AppDrawer>

      <AppContent>{children}</AppContent>
    </Box>
  );
}
