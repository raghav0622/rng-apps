'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import AppContent from '@/ui/layout/AppContent';
import AppDrawer from '@/ui/layout/AppDrawer';
import AppHeader from '@/ui/layout/AppHeader';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import DrawerContent from './drawer-content';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isSyncing } = useRNGAuth();

  // If already onboarded, send to dashboard
  useEffect(() => {
    if (!isSyncing && user && !user.onboarded) {
      redirect('/onboarding');
    }
  }, [user, isSyncing]);

  return (
    <>
      <AppHeader />

      <AppDrawer>
        <DrawerContent />
      </AppDrawer>
      <AppContent>{children}</AppContent>
    </>
  );
}
