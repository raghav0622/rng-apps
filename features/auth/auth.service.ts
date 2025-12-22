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

      // STORAGE CLEANUP: Delete old avatar if changed
      const isUpdatingAvatar = data.photoUrl !== undefined;
      const hasOldAvatar = !!currentUser.photoUrl;
      const isDifferent = data.photoUrl !== currentUser.photoUrl;

      if (isUpdatingAvatar && hasOldAvatar && isDifferent) {
        // We await this but catch errors internally in deleteFileByUrl if needed,
        // or let it fail if you want strict consistency.
        // Assuming StorageService.deleteFileByUrl handles 404s gracefully.
        await StorageService.deleteFileByUrl(currentUser.photoUrl!);
      }

      // Update Firebase Auth Profile
      await auth().updateUser(uid, {
        displayName: data.displayName,
        photoURL: data.photoUrl || null,
      });

      // Update Custom Claims
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
}
