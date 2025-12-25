import { AuthProvider } from '@/core/auth/auth.context';
import { userRepository } from '@/core/auth/user.repository';
import { OrgProvider } from '@/core/org/org.context';
import { organizationRepository } from '@/core/org/org.repository';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { Box } from '@mui/material';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
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

  // 1. Fetch User
  const user = await userRepository.get(uid);
  if (!user) redirect('/login');

  // 2. The Onboarding Wall
  if (!user.orgId || user.orgRole === 'NOT_IN_ORG') {
    redirect('/onboarding');
  }

  // 3. Fetch Organization
  const org = await organizationRepository.get(user.orgId);
  if (!org) {
    // Anomaly: User has orgId but org doesn't exist.
    // Self-healing or error page? For now, redirect to onboarding to fix state.
    redirect('/onboarding');
  }

  return (
    <AuthProvider user={user}>
      <OrgProvider org={org}>
        <LayoutContextProvider>
          <Box sx={{ display: 'flex' }}>
            {/* Header & Sidebar */}
            <AppHeader />
            <AppDrawer />

            {/* Main Content Area */}
            <AppContent>{children}</AppContent>
          </Box>
        </LayoutContextProvider>
      </OrgProvider>
    </AuthProvider>
  );
}
