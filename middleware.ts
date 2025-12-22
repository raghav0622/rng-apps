import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE_NAME } from './lib/constants';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_ROUTE, isAuthRoute, isProtectedRoute } from './routes';

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = !!sessionToken;

  const isAuthPage = isAuthRoute(nextUrl.pathname);
  const isProtected = isProtectedRoute(nextUrl.pathname);

  // 1. Authenticated users trying to access Login/Signup -> Redirect to Dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // 2. Unauthenticated users trying to access Protected pages -> Redirect to Login
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(LOGIN_ROUTE, nextUrl);

    // Only add redirect_to if it's not already the login page
    const from = nextUrl.pathname + nextUrl.search;
    loginUrl.searchParams.set('redirect_to', from);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
