import AppHeader from '@/app/(protected)/AppHeader';
import { AuthProvider } from '@/core/auth/auth.context';
import { userRepository } from '@/core/auth/user.repository';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { Toolbar } from '@mui/material';
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
            <AppHeader drawerDisabled />
            <Toolbar variant="dense" />
            {children}
    </AuthProvider>
  );
}
