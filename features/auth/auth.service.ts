// features/auth/auth.service.ts
import 'server-only';

import { StorageService } from '@/features/storage/storage.service';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { AdminFirestore, auth } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { cookies, headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { UserRoleInOrg } from '../enums';
import { Session, SignupInput, UserInSession } from './auth.model';
import { authRepository } from './auth.repository';

export class AuthService {
  // ... (signin, signup, createSession, logout, revokeAllSessions, getActiveSessions, revokeSession remain unchanged)

  static async signin({ email }: { email: string }): Promise<Result<string>> {
    try {
      const userProfile = await authRepository.getUserByEmail(email);

      const customToken = await auth().createCustomToken(userProfile.uid, {
        onboarded: userProfile.onboarded,
        orgRole: userProfile.orgRole,
        orgId: userProfile.orgId || undefined,
        displayName: userProfile.displayName,
      });

      return {
        success: true,
        data: customToken,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, error.message);
    }
  }

  static async signup({ displayName, email, password }: SignupInput): Promise<Result<string>> {
    try {
      const userCredential = await auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      const defaultRole = UserRoleInOrg.NOT_IN_ORG;

      await auth().setCustomUserClaims(userCredential.uid, {
        displayName: displayName,
        onboarded: false,
        orgRole: defaultRole,
        orgId: undefined,
      });

      const customToken = await auth().createCustomToken(userCredential.uid, {
        displayName: displayName,
        onboarded: false,
        orgRole: defaultRole,
        orgId: undefined,
      });

      await authRepository.signUpUser({
        uid: userCredential.uid,
        email,
        displayName,
      });

      return {
        success: true,
        data: customToken,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, error.message);
    }
  }

  static async createSession(idToken: string): Promise<Result<void>> {
    try {
      const decodedToken = await authRepository.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const authSessionCookie = await authRepository.createSessionCookie(idToken, expiresIn);

      const sessionId = uuidv4();
      const headersList = await headers();
      const ip = headersList.get('x-forwarded-for') || 'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      await authRepository.createSessionRecord({
        sessionId,
        uid,
        createdAt: AdminFirestore.Timestamp.now(),
        expiresAt: AdminFirestore.Timestamp.fromMillis(Date.now() + expiresIn),
        ip,
        userAgent,
        isValid: true,
      });

      const cookieStore = await cookies();

      cookieStore.set(AUTH_SESSION_COOKIE_NAME, authSessionCookie, {
        maxAge: expiresIn / 1000,
        expires: new Date(Date.now() + expiresIn),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });

      cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, {
        maxAge: expiresIn / 1000,
        expires: new Date(Date.now() + expiresIn),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });

      return { success: true, data: undefined };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Failed to create secure session.');
    }
  }

  static async logout(): Promise<Result<void>> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
    const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

    if (sessionCookie && sessionId) {
      try {
        const claims = await authRepository.verifySessionCookie(sessionCookie);
        await authRepository.deleteSessionRecord(claims.uid, sessionId);
      } catch (e) {
        // Ignore errors during logout (e.g., if user already deleted)
      }
    }

    cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
    cookieStore.delete(SESSION_ID_COOKIE_NAME);

    return { success: true, data: undefined };
  }

  static async revokeAllSessions(userId: string): Promise<Result<void>> {
    try {
      await authRepository.revokeAllUserSessions(userId);
      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to revoke sessions');
    }
  }

  static async getActiveSessions(userId: string): Promise<Result<Session[]>> {
    try {
      const sessions = await authRepository.getUserSessions(userId);
      return { success: true, data: sessions };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to get sessions');
    }
  }

  static async revokeSession(userId: string, sessionId: string): Promise<Result<void>> {
    try {
      await authRepository.deleteSessionRecord(userId, sessionId);
      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to revoke session');
    }
  }

  // --- UPDATED METHODS ---

  static async updateUserProfile(
    uid: string,
    data: { displayName: string; photoUrl?: string },
  ): Promise<Result<void>> {
    try {
      const currentUser = await authRepository.getUser(uid);

      // STORAGE CLEANUP: Delete old avatar if changed
      if (
        data.photoUrl !== undefined &&
        currentUser.photoUrl &&
        currentUser.photoUrl !== data.photoUrl
      ) {
        await StorageService.deleteFileByUrl(currentUser.photoUrl);
      }

      await auth().updateUser(uid, {
        displayName: data.displayName,
        photoURL: data.photoUrl || null,
      });

      const existingClaims = (await auth().getUser(uid)).customClaims || {};
      await auth().setCustomUserClaims(uid, {
        ...existingClaims,
        displayName: data.displayName,
        picture: data.photoUrl || null,
      });

      await authRepository.updateUser(uid, {
        displayName: data.displayName,
        photoUrl: data.photoUrl || '',
      });

      return { success: true, data: undefined };
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to update profile');
    }
  }

  static async deleteUserAccount(uid: string): Promise<Result<void>> {
    try {
      // 1. Try to fetch user to clean up avatar (Fail safely if user already gone)
      try {
        const currentUser = await authRepository.getUser(uid);
        if (currentUser.photoUrl) {
          await StorageService.deleteFileByUrl(currentUser.photoUrl);
        }
      } catch (e) {
        // User might not exist in Firestore, continue to cleanup Auth
      }

      // 2. Delete Firestore Data
      // This internally calls revokeAllUserSessions, which might fail if user invalid, so we wrap it.
      try {
        await authRepository.deleteUserAndSessions(uid);
      } catch (e) {
        console.warn('Failed to delete user sessions/doc', e);
      }

      // 3. Delete Auth Account
      try {
        await auth().deleteUser(uid);
      } catch (e: any) {
        // If user not found, they are already deleted.
        if (e.code !== 'auth/user-not-found') {
          console.error('Delete Auth User Error', e);
          throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to delete account');
        }
      }

      // 4. Clear Cookies (This is crucial)
      await AuthService.logout();

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Delete Account Error:', error);
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to delete account');
    }
  }

  /**
   * Updates the current session cookie with new partial data
   */
  async refreshSession(updates: Partial<UserInSession>) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;

    // 1. Decrypt existing session
    const session = await decrypt(sessionCookie);

    if (!session) return null;

    // 2. Merge new data (e.g., new photoUrl)
    const newSessionPayload = {
      ...session,
      ...updates,
      // Ensure specific fields like 'user' object are updated correctly
      user: {
        ...session.user,
        ...updates,
      },
    };

    // 3. Re-encrypt and set the new cookie
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const encryptedSession = await encrypt(newSessionPayload);

    cookieStore.set('session', encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expires,
      sameSite: 'lax',
      path: '/',
    });

    return { success: true, data: newSessionPayload };
  }
}
