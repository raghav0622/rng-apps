'use server';

import { authService } from '@/core/auth/auth.service';
import { actionClient } from '@/core/safe-action/safe-action';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { env } from '@/lib/env';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginSchema, SignUpSchema } from './auth.model';

export const signUpAction = actionClient
  .metadata({ name: 'auth.signup' })
  .schema(SignUpSchema)
  .action(async ({ parsedInput }) => {
    // Keeps Atomic Transaction: Auth User + Firestore User Profile
    return await authService.signup(parsedInput);
  });

export const loginAction = actionClient
  .metadata({ name: 'auth.login' })
  .schema(LoginSchema)
  .action(async ({ parsedInput }) => {
    // Server-side login is required to generate the HTTP-Only Session Cookie
    const result = await authService.login(parsedInput.email, parsedInput.password);

    if (!result.success) return result;

    const { sessionCookie, expiresIn, sessionId } = result.data;
    const cookieStore = await cookies();

    const options = {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };

    cookieStore.set(AUTH_SESSION_COOKIE_NAME, sessionCookie, options);
    cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, options);

    redirect(DEFAULT_LOGIN_REDIRECT);
  });

export const logoutAction = actionClient.metadata({ name: 'auth.logout' }).action(async () => {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
  cookieStore.delete(SESSION_ID_COOKIE_NAME);
  redirect('/login');
});
