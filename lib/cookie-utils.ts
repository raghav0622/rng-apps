import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';

export const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 Days

export const getCookieOptions = () => ({
  maxAge: SESSION_DURATION_MS / 1000,
  expires: new Date(Date.now() + SESSION_DURATION_MS),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'lax' as const,
});

export const SESSION_COOKIES = [AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME];
