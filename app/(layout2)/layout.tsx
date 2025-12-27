import AppHeader from '@/app/(protected)/AppHeader';
import { SessionPoller } from '@/app/(protected)/SessionPoller';
import { SessionService } from '@/core/auth/session.service';
import { AuthProvider } from '@/core/auth/auth.context';
import { OrgProvider } from '@/core/organization/organization.context';
import { Toolbar } from '@mui/material';
import { ReactNode } from 'react';

export default async function Layout2({ children }: { children: ReactNode }) {
  // 🛡️ Centralized session and profile retrieval
  const { org, user } = await SessionService.requireUserAndOrg({ strictOrg: false });

  return (
    <AuthProvider user={user}>
      <OrgProvider org={org}>
        <SessionPoller />
        <AppHeader drawerDisabled />
        <Toolbar variant="dense" />
        {children}
      </OrgProvider>
    </AuthProvider>
  );
}
