import { AuthProvider } from '@/core/auth/auth.context';
import { SessionService } from '@/core/auth/session.service';
import { OrgProvider } from '@/core/organization/organization.context';
import { ReactNode } from 'react';
import AppContent from './AppContent';
import AppDrawer from './AppDrawer';
import AppHeader from './AppHeader';
import { SessionPoller } from './SessionPoller';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  // 🛡️ Ensure session, user profile, and organization context exist
  const { user, org } = await SessionService.requireUserAndOrg({ strictOrg: true });

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
