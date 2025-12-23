'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import AppContent from '@/ui/layout/AppContent';
import AppDrawer from '@/ui/layout/AppDrawer';
import AppHeader from '@/ui/layout/AppHeader';
import DrawerContent from './drawer-content';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useRNGAuth();
  const drawer = Boolean(user?.orgId && user?.onboarded);
  if (!user) {
    return null;
  }

  return (
    <>
      <AppHeader />

      {drawer && (
        <AppDrawer>
          <DrawerContent />
        </AppDrawer>
      )}
      <AppContent drawerDisabled={!drawer}>{children}</AppContent>
    </>
  );
}
