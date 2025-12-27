import { AuthProvider } from '@/core/auth/auth.context';
import { userRepository } from '@/core/auth/user.repository';
import { OrgProvider } from '@/core/organization/organization.context';
import { organizationRepository } from '@/core/organization/organization.repository';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { Box } from '@mui/material';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { SessionPoller } from './SessionPoller'; // Import Poller
import AppContent from './AppContent';
import AppDrawer from './AppDrawer';
import AppHeader from './AppHeader';
import { LayoutProvider as LayoutContextProvider } from './LayoutContext';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) redirect('/login');

  let uid: string;
  try {
    const decodedToken = await auth().verifySessionCookie(sessionCookie, true);
    uid = decodedToken.uid;
  } catch (error) {
    redirect('/login');
  }

  const user = await userRepository.get(uid);
  if (!user) redirect('/login');

  if (!user.orgId || user.orgRole === 'NOT_IN_ORG') {
    redirect('/onboarding');
  }

  const org = await organizationRepository.get(user.orgId);
  if (!org) {
    redirect('/onboarding');
  }

  return (
    <AuthProvider user={user}>
      <OrgProvider org={org}>
        <LayoutContextProvider>
          <SessionPoller /> {/* Added here */}
          <Box sx={{ display: 'flex' }}>
            <AppHeader />
            <AppDrawer />
            <AppContent>{children}</AppContent>
          </Box>
        </LayoutContextProvider>
      </OrgProvider>
    </AuthProvider>
  );
}
