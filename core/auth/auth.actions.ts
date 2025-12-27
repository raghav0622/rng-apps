'use server';

import { authService } from '@/core/auth/auth.service';
import { SessionService } from '@/core/auth/session.service';
import { actionClient, authActionClient } from '@/core/safe-action/safe-action';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { env } from '@/lib/env';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { auth } from 'firebase-admin';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { organizationRepository } from '../organization/organization.repository';
import { LoginSchema, SignUpSchema } from './auth.model';
import { userRepository } from './user.repository';

// --- Shared Cookie Helper ---
async function setSessionCookies(sessionCookie: string, expiresIn: number, sessionId: string) {
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
}

// --- getUser and getOrg helper

export const getCurrentUser = async ({ strictOrg = false }) => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) redirect('/login');

  const decodedToken = await auth().verifySessionCookie(sessionCookie, true);
  const uid = decodedToken.uid;

  const user = await userRepository.get(uid);
  if (!user) redirect('/login');

  if (strictOrg) {
    if (!user.orgId || user.orgRole === 'NOT_IN_ORG' || user.isOnboarded === false) {
      redirect('/onboarding');
    }

    const org = await organizationRepository.get(user.orgId);
    if (!org) redirect('/onboarding');

    return { org, user };
  }
  return { user, org: null };
};

// --- Auth Actions ---

export const signUpAction = actionClient
  .metadata({ name: 'auth.signup' })
  .schema(SignUpSchema)
  .action(async ({ parsedInput }) => {
    return await authService.signup(parsedInput);
  });

export const loginAction = actionClient
  .metadata({ name: 'auth.login' })
  .inputSchema(LoginSchema)
  .action(async ({ parsedInput }) => {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const ip = headersList.get('x-forwarded-for') || undefined;

    const result = await authService.login(parsedInput.email, parsedInput.password, userAgent, ip);

    if (!result.success) return result;

    await setSessionCookies(
      result.data.sessionCookie,
      result.data.expiresIn,
      result.data.sessionId,
    );
    redirect(DEFAULT_LOGIN_REDIRECT);
  });

export const logoutAction = actionClient.metadata({ name: 'auth.logout' }).action(async () => {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
  cookieStore.delete(SESSION_ID_COOKIE_NAME);
  redirect('/login');
});

// --- Session Management Actions ---

export const listSessionsAction = authActionClient
  .metadata({ name: 'auth.listSessions' })
  .action(async ({ ctx }) => {
    return await SessionService.listSessions(ctx.user.id, ctx.sessionId);
  });

export const revokeSessionAction = authActionClient
  .metadata({ name: 'auth.revokeSession' })
  .schema(z.object({ sessionId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    return await SessionService.revokeSession(ctx.user.id, parsedInput.sessionId);
  });

export const revokeAllSessionsAction = authActionClient
  .metadata({ name: 'auth.revokeAllSessions' })
  .action(async ({ ctx }) => {
    return await SessionService.revokeAllSessions(ctx.user.id, ctx.sessionId);
  });

export const checkSessionAction = authActionClient
  .metadata({ name: 'auth.checkSession' })
  .action(async () => {
    return { valid: true };
  });
