// features/auth/auth.service.ts
import { storageRepository } from '@/features/storage/storage.repository';
import { extractPathFromUrl } from '@/features/storage/storage.utils';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { Result } from '@/lib/types';
import { cookies } from 'next/headers';
import 'server-only';
import { authRepository } from './auth.repository';

export class AuthService {
  static async createSession(idToken: string, fullName?: string): Promise<Result<void>> {
    try {
      const decodedToken = await authRepository.verifyIdToken(idToken);
      const { uid, email, name, picture } = decodedToken;

      if (!email) {
        throw new CustomError(AppErrorCode.VALIDATION_ERROR, 'Email is required for sign-up.');
      }

      // Create session cookie (5 days)
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await authRepository.createSessionCookie(idToken, expiresIn);

      // Sync user data to Firestore (Source of Truth)
      await authRepository.ensureUserExists(
        uid,
        {
          email,
          displayName: name,
          photoURL: picture,
        },
        {
          lastLoginAt: new Date(),
          displayName: fullName,
        },
      );

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
      console.error('Create Session Error:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Failed to create secure session.');
    }
  }

  static async logout(): Promise<Result<void>> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
    cookieStore.delete('org_session_token'); // Clean up tenant cookie if exists
    return { success: true, data: undefined };
  }

  static async updateProfile(
    userId: string,
    data: { displayName: string; photoURL?: string | null },
  ): Promise<Result<void>> {
    try {
      const currentUser = await authRepository.getUser(userId);

      // 1. Update Source of Truth (Firestore)
      await authRepository.updateUser(userId, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      // 2. Update Auth User (Syncs to Token/Cookie claims for next refresh)
      await authRepository.updateAuthUser(userId, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      // 3. CLEANUP: Only delete old avatar if the DB updates succeeded
      if (
        currentUser?.photoURL &&
        data.photoURL !== undefined &&
        currentUser.photoURL !== data.photoURL
      ) {
        const oldPath = extractPathFromUrl(currentUser.photoURL);
        if (oldPath) {
          // Fire and forget cleanup, but logged
          storageRepository
            .deleteFile(oldPath)
            .catch((err) => console.warn(`Failed to cleanup old avatar: ${oldPath}`, err));
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Update Profile Service Error:', error);
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to update profile information.');
    }
  }

  static async deleteAccount(userId: string): Promise<Result<void>> {
    try {
      const currentUser = await authRepository.getUser(userId);

      // Delete from Firestore first
      await authRepository.deleteFirestoreUser(userId);

      // Delete from Firebase Auth
      await authRepository.deleteAuthUser(userId);

      // Cleanup Storage
      if (currentUser?.photoURL) {
        const path = extractPathFromUrl(currentUser.photoURL);
        if (path) {
          await storageRepository
            .deleteFile(path)
            .catch((e) => console.warn('Failed to delete avatar', e));
        }
      }

      // Finally logout
      await this.logout();
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Delete Account Error:', error);
      throw new CustomError(AppErrorCode.UNKNOWN, 'Failed to delete account completely.');
    }
  }
}
