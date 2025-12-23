'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { OrgProvider } from '@/features/orgs/components/OrgContext'; // Import new context
import AppContent from '@/ui/layout/AppContent';
import AppDrawer from '@/ui/layout/AppDrawer';
import AppHeader from '@/ui/layout/AppHeader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DrawerContent from './drawer-content';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isSyncing } = useRNGAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isSyncing && user && !user.onboarded) {
      router.replace('/onboarding');
    }
  }, [user, isSyncing, router]);

  if (isSyncing || (user && !user.onboarded)) return null;

  return (
    <OrgProvider>
      <AppHeader />
      <AppDrawer>
        <DrawerContent />
      </AppDrawer>
      <AppContent>{children}</AppContent>
    </OrgProvider>
  );
}
