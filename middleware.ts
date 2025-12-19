import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE_NAME } from './lib/constants';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_ROUTE, isAuthRoute, isProtectedRoute } from './routes';

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;

  const isAuthenticated = !!sessionToken;
  const isAuthPage = isAuthRoute(nextUrl.pathname);
  const isProtected = isProtectedRoute(nextUrl.pathname);

  // 1. Redirect authenticated users away from Login/Signup pages
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // 2. Redirect unauthenticated users to Login from protected pages
  if (isProtected && !isAuthenticated) {
    const response = NextResponse.redirect(new URL(LOGIN_ROUTE, nextUrl));
    // Optional: Pass the original URL to redirect back after login
    // response.cookies.set('redirect_to', nextUrl.pathname);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
