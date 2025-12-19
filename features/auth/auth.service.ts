// features/auth/auth.service.ts
import { storageRepository } from '@/features/storage/storage.repository'; // Import Storage Repo
import { extractPathFromUrl } from '@/features/storage/storage.utils'; // Import Utils
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
        throw new CustomError(AppErrorCode.VALIDATION_ERROR, 'Email is required');
      }

      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await authRepository.createSessionCookie(idToken, expiresIn);

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

  static async updateProfile(
    userId: string,
    data: { displayName: string; photoURL?: string },
  ): Promise<Result<void>> {
    try {
      // 1. Fetch current user to check for old avatar
      const currentUser = await authRepository.getUser(userId);

      // 2. Update Source of Truth (Firestore)
      await authRepository.updateUser(userId, {
        displayName: data.displayName,
        photoURL: data.photoURL || null,
      });

      // 3. Update Auth User (Syncs to Token/Cookie claims)
      await authRepository.updateAuthUser(userId, {
        displayName: data.displayName,
        photoURL: data.photoURL || null,
      });

      // 4. CLEANUP: Delete old avatar if it has changed
      if (
        currentUser?.photoURL &&
        data.photoURL !== undefined &&
        currentUser.photoURL !== data.photoURL
      ) {
        const oldPath = extractPathFromUrl(currentUser.photoURL);
        if (oldPath) {
          // Fire and forget (don't await/block the response for cleanup)
          storageRepository
            .deleteFile(oldPath)
            .catch((err) => console.error('Background cleanup failed', err));
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to update profile');
    }
  }

  static async deleteAccount(userId: string): Promise<Result<void>> {
    try {
      // 1. Fetch user to find avatar
      const currentUser = await authRepository.getUser(userId);

      // 2. Delete User Data
      await authRepository.deleteFirestoreUser(userId);
      await authRepository.deleteAuthUser(userId);

      // 3. Cleanup Avatar
      if (currentUser?.photoURL) {
        const path = extractPathFromUrl(currentUser.photoURL);
        if (path) await storageRepository.deleteFile(path);
      }

      await this.logout();
      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.UNKNOWN, 'Failed to delete account');
    }
  }
}
