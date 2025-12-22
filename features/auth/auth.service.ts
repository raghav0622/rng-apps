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
import { Session, SignupInput } from './auth.model';
import { authRepository } from './auth.repository';

export class AuthService {
  /**
   * Generates a custom token for a user.
   * Useful if you have a separate API authentication flow.
   */
  static async signin({ email }: { email: string }): Promise<Result<string>> {
    try {
      const userProfile = await authRepository.getUserByEmail(email);

      const customToken = await auth().createCustomToken(userProfile.uid, {
        onboarded: userProfile.onboarded,
        orgRole: userProfile.orgRole,
        orgId: userProfile.orgId || undefined,
        displayName: userProfile.displayName,
      });

      return { success: true, data: customToken };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, error.message);
    }
  }

  /**
   * Creates a new user in Firebase Auth and Firestore.
   */
  static async signup({ displayName, email, password }: SignupInput): Promise<Result<string>> {
    try {
      const userCredential = await auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      const defaultRole = UserRoleInOrg.NOT_IN_ORG;

      // Set initial claims
      await auth().setCustomUserClaims(userCredential.uid, {
        displayName: displayName,
        onboarded: false,
        orgRole: defaultRole,
        orgId: undefined,
      });

      // Create DB Record
      await authRepository.signUpUser({
        uid: userCredential.uid,
        email,
        displayName,
      });

      // Generate token for immediate client-side sign-in if needed
      const customToken = await auth().createCustomToken(userCredential.uid, {
        displayName: displayName,
        onboarded: false,
        orgRole: defaultRole,
        orgId: undefined,
      });

      return { success: true, data: customToken };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, error.message);
    }
  }

  /**
   * Validates ID Token and creates a Session Cookie.
   */
  static async createSession(idToken: string): Promise<Result<void>> {
    try {
      const decodedToken = await authRepository.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // 5 Days Session
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const authSessionCookie = await authRepository.createSessionCookie(idToken, expiresIn);
      const sessionId = uuidv4();

      const headersList = await headers();
      const ip = headersList.get('x-forwarded-for') || 'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      if (decodedToken.email_verified) {
        // We fire and forget this update to not slow down login
        authRepository.updateUser(uid, { emailVerified: true }).catch(console.error);
      }

      // Store Session Metadata in Firestore
      await authRepository.createSessionRecord({
        sessionId,
        uid,
        createdAt: AdminFirestore.Timestamp.now(),
        expiresAt: AdminFirestore.Timestamp.fromMillis(Date.now() + expiresIn),
        ip,
        userAgent,
        isValid: true,
      });

      // Set Cookies
      const cookieStore = await cookies();
      const cookieOptions = {
        maxAge: expiresIn / 1000,
        expires: new Date(Date.now() + expiresIn),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax' as const,
      };

      cookieStore.set(AUTH_SESSION_COOKIE_NAME, authSessionCookie, cookieOptions);
      cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, cookieOptions);

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Create Session Error:', error);
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
        // User might already be deleted or cookie invalid
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

  // --- PROFILE MANAGEMENT ---

  static async refreshEmailVerificationStatus(uid: string): Promise<Result<void>> {
    try {
      // 1. Get the authoritative user record from Firebase Admin
      const firebaseUser = await auth().getUser(uid);

      // 2. If the Auth service says they are verified...
      if (firebaseUser.emailVerified) {
        // 3. ... Update the Database
        await authRepository.updateUser(uid, {
          emailVerified: true,
        });
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Sync Error:', error);
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to sync verification status');
    }
  }

  static async updateUserProfile(
    uid: string,
    data: { displayName: string; photoUrl?: string },
  ): Promise<Result<void>> {
    try {
      const currentUser = await authRepository.getUser(uid);

      // STORAGE CLEANUP: Delete old avatar if changed
      // Condition: New URL provided AND Old URL exists AND they are different
      if (
        data.photoUrl !== undefined &&
        currentUser.photoUrl &&
        currentUser.photoUrl !== data.photoUrl
      ) {
        if (data.photoUrl !== currentUser.photoUrl) {
          await StorageService.deleteFileByUrl(currentUser.photoUrl);
        }
      }

      // Update Firebase Auth Profile
      await auth().updateUser(uid, {
        displayName: data.displayName,
        photoURL: data.photoUrl || null,
      });

      // Update Custom Claims (Note: This won't reflect in the CURRENT session cookie)
      const existingClaims = (await auth().getUser(uid)).customClaims || {};
      await auth().setCustomUserClaims(uid, {
        ...existingClaims,
        displayName: data.displayName,
        picture: data.photoUrl || null,
      });

      // Update Firestore
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
      // 1. Cleanup Storage
      try {
        const currentUser = await authRepository.getUser(uid);
        if (currentUser.photoUrl) {
          await StorageService.deleteFileByUrl(currentUser.photoUrl);
        }
      } catch (e) {
        console.warn('Could not fetch user for cleanup', e);
      }

      // 2. Delete Firestore Data & Sessions
      try {
        await authRepository.deleteUserAndSessions(uid);
      } catch (e) {
        console.warn('Failed to delete user sessions/doc', e);
      }

      // 3. Delete Auth Account
      try {
        await auth().deleteUser(uid);
      } catch (e: any) {
        if (e.code !== 'auth/user-not-found') {
          throw e;
        }
      }

      // 4. Force Logout
      await AuthService.logout();

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Delete Account Error:', error);
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to delete account');
    }
  }

  /**
   * Generates a password reset link (Admin SDK).
   * Typically used if you send emails from the server.
   * For client-side triggering, use the Client SDK in a hook.
   */
  static async generatePasswordResetLink(email: string): Promise<Result<string>> {
    try {
      const link = await auth().generatePasswordResetLink(email);
      return { success: true, data: link };
    } catch (error) {
      throw new CustomError(AppErrorCode.UNKNOWN, 'Failed to generate reset link');
    }
  }
}
