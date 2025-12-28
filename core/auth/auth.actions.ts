'use server';

import { authService } from '@/core/auth/auth.service';
import { SessionService } from '@/core/auth/session.service';
import { actionClient, authActionClient, rateLimitMiddleware } from '@/core/safe-action/safe-action';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { env } from '@/lib/env';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { LoginSchema, SignUpSchema } from './auth.model';

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

// --- Auth Actions ---

export const signUpAction = actionClient
  .metadata({ name: 'auth.signup' })
  .schema(SignUpSchema)
  .use(rateLimitMiddleware) // 🛡️ Rate limit signup
  .action(async ({ parsedInput }) => {
    return await authService.signup(parsedInput);
  });

export const loginAction = actionClient
  .metadata({ name: 'auth.login' })
  .schema(LoginSchema)
  .use(rateLimitMiddleware) // 🛡️ Rate limit login
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
    return await SessionService.listSessions(ctx.userId, ctx.sessionId);
  });

export const revokeSessionAction = authActionClient
  .metadata({ name: 'auth.revokeSession' })
  .schema(z.object({ sessionId: z.string() }))
  .use(rateLimitMiddleware)
  .action(async ({ ctx, parsedInput }) => {
    return await SessionService.revokeSession(ctx.userId, parsedInput.sessionId);
  });

export const revokeAllSessionsAction = authActionClient
  .metadata({ name: 'auth.revokeAllSessions' })
  .use(rateLimitMiddleware)
  .action(async ({ ctx }) => {
    return await SessionService.revokeAllSessions(ctx.userId, ctx.sessionId);
  });

export const checkSessionAction = authActionClient
  .metadata({ name: 'auth.checkSession' })
  .action(async () => {
    return { valid: true };
  });
