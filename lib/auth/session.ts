import { AUTH_SESSION_COOKIE_NAME, ORG_SESSION_COOKIE_NAME } from '@/lib/constants';
import { UserRole } from '@/lib/enums';
import { auth, firestore } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import 'server-only';

export type SessionUser = {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoURL: string | null;
  orgId?: string;
  role?: UserRole;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const orgId = cookieStore.get(ORG_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    // 1. Verify the session cookie
    const decodedToken = await auth().verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;

    // 2. FETCH: Get the latest profile from Firestore (The "Truth")
    // This ensures we see the name even if the cookie is stale
    const userDoc = await firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();

    return {
      uid: uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
      // PREFER Firestore data, fallback to token claims
      displayName: userData?.displayName || decodedToken.name || null,
      photoURL: userData?.photoURL || decodedToken.picture || null,
      orgId: orgId, // We will use this in the next step
    };
  } catch (error) {
    // If cookie is invalid/expired
    return null;
  }
}
