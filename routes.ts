export const ROOT_ROUTE = '/';
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';
export const LOGIN_ROUTE = '/login';
export const PUBLIC_ROUTES = new Set<string>([]);
export const AUTH_ROUTES = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/logout',
]);

export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.has(path);
}

export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.has(path);
}

export function isProtectedRoute(path: string): boolean {
  return !isPublicRoute(path) && !isAuthRoute(path);
}
