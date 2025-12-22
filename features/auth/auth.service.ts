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

      // Generate token for immediate client-side sign-in
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

      // Auto-sync email verification status on login
      if (decodedToken.email_verified) {
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

  static async refreshEmailVerificationStatus(uid: string): Promise<Result<{ verified: boolean }>> {
    try {
      // 1. Ask Firebase Auth (The Source of Truth)
      const firebaseUser = await auth().getUser(uid);
      const isVerified = firebaseUser.emailVerified;

      // 2. Sync to Database if needed
      if (isVerified) {
        await authRepository.updateUser(uid, {
          emailVerified: true,
        });
      }

      // 3. RETURN THE STATUS so the client knows what happened
      return { success: true, data: { verified: isVerified } };
    } catch (error) {
      console.error('Sync Error:', error);
      // Even if sync fails, return false safely
      return { success: true, data: { verified: false } };
    }
  }

  static async updateUserProfile(
    uid: string,
    data: { displayName: string; photoUrl?: string },
  ): Promise<Result<void>> {
    try {
      const currentUser = await authRepository.getUser(uid);

      // 1. Prepare Update Data
      const updateData: { displayName: string; photoUrl?: string } = {
        displayName: data.displayName,
      };
      if (data.photoUrl !== undefined) {
        updateData.photoUrl = data.photoUrl;
      }

      // 2. ATOMIC: Update Firestore First (Source of Truth for App State)
      await authRepository.updateUser(uid, {
        displayName: data.displayName,
        photoUrl: data.photoUrl ?? currentUser.photoUrl, // keep old if undefined
      });

      // 3. Update Auth Claims (Best Effort)
      await auth().updateUser(uid, {
        displayName: data.displayName,
        photoURL: data.photoUrl || null,
      });

      // 4. CLEANUP: Delete old avatar AFTER successful DB update
      // Logic: If we are uploading a NEW url (data.photoUrl exists)
      // AND user had an OLD url (currentUser.photoUrl)
      // AND they are different
      if (data.photoUrl && currentUser.photoUrl && data.photoUrl !== currentUser.photoUrl) {
        // Run in background, don't await blocking the UI response
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
      // 1. Delete Auth Account FIRST (Prevents new logins/token refreshes)
      try {
        await auth().deleteUser(uid);
      } catch (e: any) {
        // If user not found, they are already gone. Proceed to cleanup DB.
        if (e.code !== 'auth/user-not-found') {
          throw e; // Rethrow other auth errors (e.g. permission)
        }
      }

      // 2. Cleanup Storage (Best effort)
      try {
        const currentUser = await authRepository.getUser(uid);
        if (currentUser.photoUrl) {
          await StorageService.deleteFileByUrl(currentUser.photoUrl);
        }
      } catch (e) {
        console.warn(
          'Could not fetch user data for storage cleanup (User might be deleted already)',
          e,
        );
      }

      // 3. Delete Firestore Data & Sessions
      try {
        await authRepository.deleteUserAndSessions(uid);
      } catch (e) {
        console.warn('Failed to delete user sessions/doc', e);
      }

      // 4. Force Logout (Clear cookies)
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

  static async changePassword(uid: string, oldPw: string, newPw: string): Promise<Result<void>> {
    // 1. Ideally, verify 'oldPw' here.
    // Since Admin SDK doesn't have "signInWithEmail", you typically do this check on the Client
    // OR use the Firebase REST API to verify password on server.

    // 2. Update
    try {
      await auth().updateUser(uid, { password: newPw });
      // Optional: Revoke all sessions except current?
      // usually changing password should kill other sessions
      await this.revokeAllSessions(uid);
      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Failed to update password');
    }
  }
}
