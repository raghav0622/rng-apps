export const ROOT_ROUTE = '/';
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';
export const LOGIN_ROUTE = '/login';
export const ONBOARDING_ROUTE = '/onboarding';
export const PUBLIC_ROUTES = new Set<string>([]);

// Routes that are ONLY for unauthenticated users
export const AUTH_ROUTES = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/auth-action-handler',
]);

export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.has(path);
}

export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.has(path);
}

export function isProtectedRoute(path: string): boolean {
  // If it's not public and not an auth route, it's protected
  // Note: We don't want /logout to be considered "Protected" in a way that redirects to login if we are already there,
  // but usually logout action is protected.
  // For your middleware logic:
  return !isPublicRoute(path) && !isAuthRoute(path);
}
