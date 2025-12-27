import AppHeader from '@/app/(protected)/AppHeader';
import { LayoutProvider } from '@/app/(protected)/LayoutContext'; // Import LayoutProvider
import { SessionPoller } from '@/app/(protected)/SessionPoller'; // Import SessionPoller
import { AuthProvider } from '@/core/auth/auth.context';
import { userRepository } from '@/core/auth/user.repository';
import { OrgProvider } from '@/core/organization/organization.context'; // Import OrgProvider
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { Box, Toolbar } from '@mui/material';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function Layout2({ children }: { children: ReactNode }) {
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

  return (
    <AuthProvider user={user}>
      {/* 
          Layout2 is for authenticated users who might NOT have an Org yet (Onboarding)
          or are in a context where Org doesn't matter (Profile).
          We provide a null org context to satisfy AppHeader.
      */}
      <OrgProvider org={null}>
        <LayoutProvider>
          <SessionPoller /> {/* Added Polling Here */}
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppHeader drawerDisabled />
            <Toolbar variant="dense" />
            {children}
          </Box>
        </LayoutProvider>
      </OrgProvider>
    </AuthProvider>
  );
}
