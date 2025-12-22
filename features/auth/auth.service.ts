// features/auth/auth.service.ts
import 'server-only';

import { StorageService } from '@/features/storage/storage.service';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { AdminFirestore, auth } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { cookies, headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { Session, SignupInput } from './auth.model';
import { authRepository } from './auth.repository';

// CENTRALIZED COOKIE CONFIGURATION
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 Days

const getCookieOptions = () => ({
  maxAge: SESSION_DURATION_MS / 1000,
  expires: new Date(Date.now() + SESSION_DURATION_MS),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'lax' as const,
});

export class AuthService {
  /**
   * Helper: Call Firebase REST API
   */
  private static async callAuthApi(endpoint: string, body: object) {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY');

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, data.error?.message || 'Auth API Error');
    }
    return data;
  }

  static async verifyEmail(oobCode: string): Promise<Result<void>> {
    try {
      // https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/update
      await this.callAuthApi('update', { oobCode });
      return { success: true, data: undefined };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired verification code');
    }
  }

  static async confirmPasswordReset(oobCode: string, newPassword: string): Promise<Result<void>> {
    try {
      // https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/resetPassword
      await this.callAuthApi('resetPassword', { oobCode, newPassword });
      return { success: true, data: undefined };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired reset code');
    }
  }

  /**
   * Helper: Verify password using Firebase REST API (Admin SDK cannot do this)
   */
  private static async verifyPassword(email: string, password: string): Promise<boolean> {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY');

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );

    const data = await response.json();
    if (!response.ok || data.error) return false;
    return true;
  }

  /**
   * Generates a custom token for a user.
   * REFACTOR: Removed mutable custom claims. Only UID is essential.
   */
  static async signin({ email }: { email: string }): Promise<Result<string>> {
    try {
      const userProfile = await authRepository.getUserByEmail(email);

      // Only create token with UID. No stale profile data in claims.
      const customToken = await auth().createCustomToken(userProfile.uid);

      return { success: true, data: customToken };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, error.message);
    }
  }

  /**
   * Creates a new user in Firebase Auth and Firestore.
   * REFACTOR: Removed mutable custom claims.
   */
  static async signup({ displayName, email, password }: SignupInput): Promise<Result<string>> {
    try {
      const userCredential = await auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      // Create DB Record (Source of Truth)
      await authRepository.signUpUser({
        uid: userCredential.uid,
        email,
        displayName,
      });

      // Generate token for immediate client-side sign-in
      // No custom claims needed. Client will rely on DB for profile info.
      const customToken = await auth().createCustomToken(userCredential.uid);

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

      // Create the Session Cookie
      const authSessionCookie = await authRepository.createSessionCookie(
        idToken,
        SESSION_DURATION_MS,
      );
      const sessionId = uuidv4();

      const headersList = await headers();

      // Parallelize independent operations
      await Promise.all([
        // 1. Sync Email Verification (Self-healing)
        decodedToken.email_verified
          ? authRepository.updateUser(uid, { emailVerified: true }).catch(console.error)
          : Promise.resolve(),

        // 2. Create Session Record
        authRepository.createSessionRecord({
          sessionId,
          uid,
          createdAt: AdminFirestore.Timestamp.now(),
          expiresAt: AdminFirestore.Timestamp.fromMillis(Date.now() + SESSION_DURATION_MS),
          ip: headersList.get('x-forwarded-for') || 'unknown',
          userAgent: headersList.get('user-agent') || 'unknown',
          isValid: true,
        }),
      ]);

      // Set Cookies
      const cookieStore = await cookies();
      const options = getCookieOptions();

      cookieStore.set(AUTH_SESSION_COOKIE_NAME, authSessionCookie, options);
      cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, options);

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

  static async refreshEmailVerificationStatus(uid: string): Promise<Result<{ verified: boolean }>> {
    try {
      const firebaseUser = await auth().getUser(uid);
      const isVerified = firebaseUser.emailVerified;

      if (isVerified) {
        await authRepository.updateUser(uid, {
          emailVerified: true,
        });
      }

      return { success: true, data: { verified: isVerified } };
    } catch (error) {
      console.error('Sync Error:', error);
      return { success: true, data: { verified: false } };
    }
  }

  static async updateUserProfile(
    uid: string,
    data: { displayName: string; photoUrl?: string },
  ): Promise<Result<void>> {
    try {
      const currentUser = await authRepository.getUser(uid);

      // 1. Update Firestore (Source of Truth)
      await authRepository.updateUser(uid, {
        displayName: data.displayName,
        photoUrl: data.photoUrl ?? currentUser.photoUrl,
      });

      // 2. Update Auth (Best effort for things like emails sent by Firebase)
      await auth().updateUser(uid, {
        displayName: data.displayName,
        photoURL: data.photoUrl || null,
      });

      // 3. Cleanup old avatar if it changed
      if (data.photoUrl && currentUser.photoUrl && data.photoUrl !== currentUser.photoUrl) {
        StorageService.deleteFileByUrl(currentUser.photoUrl).catch((err) =>
          console.warn('Failed to clean up old avatar', err),
        );
      }

      return { success: true, data: undefined };
    } catch (error: any) {
      console.error('Update Profile Error:', error);
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to update profile');
    }
  }

  static async deleteUserAccount(uid: string): Promise<Result<void>> {
    try {
      // 1. Delete Auth Account
      try {
        await auth().deleteUser(uid);
      } catch (e: any) {
        if (e.code !== 'auth/user-not-found') throw e;
      }

      // 2. Cleanup Storage
      try {
        const currentUser = await authRepository.getUser(uid);
        if (currentUser.photoUrl) {
          await StorageService.deleteFileByUrl(currentUser.photoUrl);
        }
      } catch (e) {
        console.warn('Cleanup warning during delete', e);
      }

      // 3. Delete Data
      await authRepository.deleteUserAndSessions(uid);

      // 4. Logout
      await AuthService.logout();

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Delete Account Error:', error);
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to delete account');
    }
  }

  static async generatePasswordResetLink(email: string): Promise<Result<string>> {
    try {
      const link = await auth().generatePasswordResetLink(email);
      return { success: true, data: link };
    } catch (error) {
      throw new CustomError(AppErrorCode.UNKNOWN, 'Failed to generate reset link');
    }
  }

  static async changePassword(
    uid: string,
    email: string,
    oldPw: string,
    newPw: string,
  ): Promise<Result<void>> {
    try {
      // 1. Verify old password using REST API
      if (!email) throw new CustomError(AppErrorCode.INVALID_INPUT, 'User has no email');

      const isVerified = await this.verifyPassword(email, oldPw);
      if (!isVerified) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Incorrect current password');
      }

      // 2. Update to new password
      await auth().updateUser(uid, { password: newPw });

      // 3. Revoke all sessions (Security Best Practice)
      await this.revokeAllSessions(uid);

      return { success: true, data: undefined };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Failed to update password');
    }
  }
}
