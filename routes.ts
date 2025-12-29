/**
 * 🛣️ Routes Configuration
 * Defines strict route groups for the application.
 */

export const ROOT_ROUTE = '/';
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';
export const LOGIN_ROUTE = '/login';
export const ONBOARDING_ROUTE = '/onboarding';

// Routes that are accessible to everyone (e.g., Landing Page)
export const PUBLIC_ROUTES = new Set<string>([
  // Add '/pricing', '/about', etc. here
]);

// Routes that are ONLY for unauthenticated users (Redirect to Dashboard if logged in)
export const AUTH_ROUTES = new Set(['/login', '/signup', '/forgot-password', '/action-handler']);

/**
 * Checks if a path is an Authentication Route (Login/Signup).
 */
export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.has(path);
}

/**
 * Checks if a path is Public.
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.has(path);
}

/**
 * Checks if a path requires Authentication.
 * Logic: All routes are Protected by default unless explicitly Public or Auth-only.
 */
export function isProtectedRoute(path: string): boolean {
  return !isPublicRoute(path) && !isAuthRoute(path);
}
