import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from './lib/constants';
import { DEFAULT_LOGIN_REDIRECT, LOGIN_ROUTE, isAuthRoute, isProtectedRoute } from './routes';

const SECURITY_HEADERS = {
  // HSTS: Force HTTPS for 1 year, include subdomains
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Clickjacking protection
  'X-Frame-Options': 'DENY',
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = !!sessionToken;

  const isAuthPage = isAuthRoute(nextUrl.pathname);
  const isProtected = isProtectedRoute(nextUrl.pathname);

  // --- Logic 1: Route Protection ---
  if (isAuthPage && isAuthenticated) {
    // 🛑 CRITICAL FIX: Break Infinite Loops / Zombie Sessions 🛑
    // If the user is redirected to login with a specific reason (e.g., "session_revoked"),
    // it means the App (Client/Server) determined the session is dead.
    // We MUST clear the cookies and allow access to the Login page.
    if (nextUrl.searchParams.has('reason')) {
      const response = NextResponse.next();
      response.cookies.delete(AUTH_SESSION_COOKIE_NAME);
      response.cookies.delete(SESSION_ID_COOKIE_NAME);
      return response;
    }

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

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
