'use client';

import AppContent from '@/ui/layout/AppContent';
import AppHeader from '@/ui/layout/AppHeader';
import React from 'react';

export default function DashboardLayoutWithoutDrawer({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader drawerDisabled />

      <AppContent drawerDisabled>{children}</AppContent>
    </>
  );
}
