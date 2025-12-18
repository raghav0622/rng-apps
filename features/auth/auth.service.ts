import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { auth, firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { cookies } from 'next/headers';
import 'server-only';

export class AuthService {
  /**
   * Exchanges an ID Token for a Session Cookie AND syncs the user to Firestore.
   */
  static async createSession(idToken: string, fullName?: string): Promise<Result<void>> {
    try {
      // 1. Verify the ID token
      const decodedToken = await auth().verifyIdToken(idToken);
      const { uid, email, name, picture } = decodedToken;

      if (!email) {
        throw new CustomError(AppErrorCode.VALIDATION_ERROR, 'Email is required');
      }

      // 2. Create session cookie (valid for 5 days)
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await auth().createSessionCookie(idToken, { expiresIn });

      // 3. SYNC: Ensure the user exists in Firestore
      // CRITICAL FIX: Prioritize the explicit 'fullName' from the form over the token's name
      const displayNameToUse = fullName || name;

      await this.ensureUserProfile(uid, email, displayNameToUse || undefined, picture || undefined);

      // 4. Set the cookie
      const cookieStore = await cookies();
      cookieStore.set(AUTH_SESSION_COOKIE_NAME, sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });

      return { success: true, data: undefined };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Failed to verify session');
    }
  }

  static async logout(): Promise<Result<void>> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
    cookieStore.delete('org_session_token');
    return { success: true, data: undefined };
  }

  /**
   * Idempotent upsert of user profile
   */
  static async ensureUserProfile(uid: string, email: string, name?: string, photoURL?: string) {
    const userRef = firestore().collection('users').doc(uid);
    const snapshot = await userRef.get();

    const now = new Date();

    if (!snapshot.exists) {
      // Create new user document
      await userRef.set({
        email,
        displayName: name || '', // This will now be populated correctly
        photoURL: photoURL || null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    } else {
      // Update existing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: Record<string, any> = { updatedAt: now };
      if (name) updates.displayName = name;
      if (photoURL) updates.photoURL = photoURL;

      await userRef.update(updates);
    }
  }
}
