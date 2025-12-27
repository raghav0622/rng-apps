import { getCurrentUser } from '@/core/auth/auth.actions';
import { AuthProvider } from '@/core/auth/auth.context';
import { OrgProvider } from '@/core/organization/organization.context';
import { ReactNode } from 'react';
import AppContent from './AppContent';
import AppDrawer from './AppDrawer';
import AppHeader from './AppHeader';
import { SessionPoller } from './SessionPoller'; // Import Poller

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, org } = await getCurrentUser({ strictOrg: true });

  return (
    <>
      <AuthProvider user={user}>
        <OrgProvider org={org}>
          <SessionPoller />
          <AppHeader />
          <AppDrawer />
          <AppContent>{children}</AppContent>
        </OrgProvider>
      </AuthProvider>
    </>
  );
}
