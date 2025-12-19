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

    // Add the current path as a 'redirect_to' param so we can return the user later
    // We only encode the pathname + search (query params)
    const from = nextUrl.pathname + nextUrl.search;
    loginUrl.searchParams.set('redirect_to', from);

    return NextResponse.redirect(loginUrl);
  }

  // 3. Allow request to proceed
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
     * - images/assets in public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
