import { authRepository } from '@/features/auth/auth.repository';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { cookies } from 'next/headers';
import { cache } from 'react';
import 'server-only';

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Server-Side: Get current user.
 * Strategy: Verify Cookie Claims ONLY.
 * * CHANGE: We removed the secondary Firestore fetch.
 * Since profile photos are now stored as Storage URLs (short strings),
 * they fit inside the session cookie claims.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    // 1. Verify Identity & Get Claims (Zero Latency)
    const decodedClaims = await authRepository.verifySessionCookie(sessionCookie);

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email ?? null,
      displayName: (decodedClaims.name as string) ?? null,
      photoURL: (decodedClaims.picture as string) ?? null,
    };
  } catch (error) {
    // Cookie is invalid or expired
    return null;
  }
});
