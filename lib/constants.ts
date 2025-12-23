import { env } from './env';

export const AUTH_SESSION_COOKIE_NAME = env.SESSION_COOKIE_NAME;
export const SESSION_ID_COOKIE_NAME = `${env.SESSION_COOKIE_NAME}_id`;

// Convert days to milliseconds for cookie options
export const SESSION_DURATION_MS = env.SESSION_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  HOME: '/',
  DASHBOARD: '/dashboard',
} as const;
