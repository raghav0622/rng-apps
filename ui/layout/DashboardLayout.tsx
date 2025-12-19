'use client';

import { useAuth } from '@/features/auth/components/AuthContext';
import { useUserProfile } from '@/features/auth/components/UserProfileContext';
import { LoadingSpinner } from '@/ui/shared/LoadingSpinner';
import { Box } from '@mui/material';
import React, { Suspense, lazy } from 'react';
import { AppContent } from './AppContent';
import AppDrawer from './AppDrawer';
import AppHeader from './AppHeader';

// Lazy load heavy navigation components
const DrawerContent = lazy(() => import('../DrawerContent'));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isInitialized: authInitialized, loading: authLoading } = useAuth();
  const { isInitialized: profileInitialized } = useUserProfile();

  // Prevents "Flicker": Wait for Auth to confirm state before showing Layout.
  // We check authInitialized (Client SDK ready) and authLoading (Derived state).
  if (!authInitialized || authLoading) {
    return <LoadingSpinner fullScreen message="Authenticating..." />;
  }

  // Optional: If your app heavily depends on Profile data (like Role Based Access),
  // you might want to wait for profileInitialized here too.
  // For now, we allow the layout to render to feel faster, and UserProfileContext handles its own internal loading if needed.

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
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
