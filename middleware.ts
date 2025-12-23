import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE_NAME } from './lib/constants';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_ROUTE, isAuthRoute, isProtectedRoute } from './routes';

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = !!sessionToken;

  const isAuthPage = isAuthRoute(nextUrl.pathname);
  const isProtected = isProtectedRoute(nextUrl.pathname);

  // --- Logic 1: Route Protection ---
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(LOGIN_ROUTE, nextUrl);
    // Smart Redirect: Preserve the page they were trying to visit
    loginUrl.searchParams.set('redirect_to', nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // --- Logic 2: Security Headers (Enterprise Grade) ---
  const response = NextResponse.next();

  // HSTS: Force HTTPS for 1 year, include subdomains
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Clickjacking protection
  response.headers.set('X-Frame-Options', 'DENY');

  // XSS Protection (Old browsers, but good to have)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy: Don't leak full URLs to external sites
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
