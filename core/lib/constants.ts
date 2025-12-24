import { env } from '../lib/env';

export const AUTH_SESSION_COOKIE_NAME = env.SESSION_COOKIE_NAME;
export const SESSION_ID_COOKIE_NAME = `${env.SESSION_COOKIE_NAME}_id`;

// Convert days to milliseconds for cookie options
export const SESSION_DURATION_MS = env.SESSION_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export const getCookieOptions = () => ({
  maxAge: SESSION_DURATION_MS / 1000,
  expires: new Date(Date.now() + SESSION_DURATION_MS),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'lax' as const,
});

export const SESSION_COOKIES = [AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME];
