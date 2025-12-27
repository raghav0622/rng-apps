'use server';

import { authService } from '@/core/auth/auth.service';
import { SessionService } from '@/core/auth/session.service';
import { actionClient, authActionClient } from '@/core/safe-action/safe-action';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { env } from '@/lib/env';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
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
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const ip = headersList.get('x-forwarded-for') || undefined;

    // Server-side login is required to generate the HTTP-Only Session Cookie
    const result = await authService.login(parsedInput.email, parsedInput.password, userAgent, ip);

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
    // Revoke all except current
    return await SessionService.revokeAllSessions(ctx.user.id, ctx.sessionId);
  });

/**
 * Checks if the current session is still valid in Redis.
 * Called by the client poller.
 */
export const checkSessionAction = authActionClient
  .metadata({ name: 'auth.checkSession' })
  .action(async ({ ctx }) => {
    // Since 'authActionClient' middleware ALREADY checks for session validity via SessionService.validateSession,
    // if we reach here, the session is valid.
    // If invalid, the middleware would have thrown an error or returned failure.
    return { valid: true };
  });
