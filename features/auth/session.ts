import 'server-only';

import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { serializeFirestoreData, toMillis } from '@/lib/firebase/utils';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { User } from './auth.model'; // Use the full User model
import { sessionCache } from './redis-session';

import { sessionRepository } from './repositories/session.repository';
import { userRepository } from './repositories/user.repository';

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

  if (!sessionCookie || !sessionId) return null;

  try {
    let uid: string | null = null;

    // --- LEVEL 1: REDIS CACHE (Fastest) ---
    const cachedUid = await sessionCache.verify(sessionId);

    if (cachedUid) {
      uid = cachedUid;
    } else {
      // --- LEVEL 2: FIRESTORE FALLBACK ---
      const decodedClaims = await sessionRepository.verifySessionCookie(sessionCookie);
      const dbSession = await sessionRepository.getSession(decodedClaims.uid, sessionId);

      if (!dbSession || !dbSession.isValid) {
        return null;
      }

      const now = Date.now();
      const expiresAt = toMillis(dbSession.expiresAt);

      if (expiresAt < now) {
        return null;
      }

      // RE-HYDRATE REDIS if valid
      await sessionCache.store(sessionId, decodedClaims.uid, expiresAt);
      uid = decodedClaims.uid;
    }

    if (!uid) return null;

    // --- LEVEL 3: USER PROFILE FETCH ---
    // This already uses sanitizeData internally as per your Repository update
    const user = await userRepository.getUser(uid);

    // Self-Healing: Auto-sync verification
    if (!user.emailVerified) {
      try {
        const firebaseUser = await auth().getUser(user.uid);
        if (firebaseUser.emailVerified) {
          await userRepository.updateUser(user.uid, { emailVerified: true });
          user.emailVerified = true;
        }
      } catch (e) {
        // ignore
      }
    }

    // Return the full user object to satisfy TypeScript and Layout requirements
    // sanitizeData ensures Date/Timestamp compatibility with Client Components
    return serializeFirestoreData(user);
  } catch (error) {
    return null;
  }
});
