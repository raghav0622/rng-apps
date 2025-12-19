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

  // 1. Authenticated users trying to access Login/Signup pages -> Redirect to Dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // 2. Unauthenticated users trying to access Protected pages -> Redirect to Login
  if (isProtected && !isAuthenticated) {
    // Create the login URL with a 'redirect_to' param so we can send them back after login
    const loginUrl = new URL(LOGIN_ROUTE, nextUrl);
    // loginUrl.searchParams.set('redirect_to', nextUrl.pathname); // Optional enhancement

    return NextResponse.redirect(loginUrl);
  }

  // 3. For all other routes (public, etc.), just continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc) if you add them later
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
