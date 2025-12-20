'use client';

import AppContent from '@/ui/layout/AppContent';
import AppDrawer from '@/ui/layout/AppDrawer';
import AppHeader from '@/ui/layout/AppHeader';
import DrawerContent from './drawer-content';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
