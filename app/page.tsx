import { AUTH_SESSION_COOKIE_NAME } from '@/core/constants';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_ROUTE } from '@/routes';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(AUTH_SESSION_COOKIE_NAME);

  if (session) {
    redirect(DEFAULT_LOGIN_REDIRECT);
  }

  // Alternatively, render a Landing Page here.
  // For this SaaS, we default to Login for unauthenticated users at root.
  redirect(LOGIN_ROUTE);
}
