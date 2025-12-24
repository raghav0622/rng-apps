'use server';

import { authService } from '@/core/auth/services/auth.service';
import { actionClient } from '@/core/safe-action/safe-action';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { env } from '@/lib/env';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { SignUpSchema } from '../auth.model';

// --- Login Schema ---
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Server Action: Sign Up
 */
export const signUpAction = actionClient
  .metadata({ name: 'auth.signup' })
  .schema(SignUpSchema)
  .action(async ({ parsedInput }) => {
    const result = await authService.signup(parsedInput);
    return result;
  });

/**
 * Server Action: Log In
 */
export const loginAction = actionClient
  .metadata({ name: 'auth.login' })
  .schema(LoginSchema)
  .action(async ({ parsedInput }) => {
    const result = await authService.login(parsedInput.email, parsedInput.password);

    if (!result.success) {
      return result;
    }

    const { sessionCookie, expiresIn, sessionId } = result.data;
    const cookieStore = await cookies();

    // 1. Set Firebase Auth Cookie (HttpOnly, Secure)
    cookieStore.set(AUTH_SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: expiresIn / 1000, // Seconds
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    // 2. Set Session ID Cookie (For Redis Validation)
    cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    // 3. Redirect (Throwing redirect works in Next.js Server Actions)
    redirect(DEFAULT_LOGIN_REDIRECT);
  });

/**
 * Server Action: Log Out
 */
export const logoutAction = actionClient.metadata({ name: 'auth.logout' }).action(async () => {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
  cookieStore.delete(SESSION_ID_COOKIE_NAME);
  redirect('/login');
});
