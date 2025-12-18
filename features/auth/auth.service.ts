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

      // FIX: Use split logic for Defaults vs Updates
      await authRepository.ensureUserExists(
        uid,
        // 1. Defaults (Used only if creating new user)
        {
          email,
          displayName: name,
          photoURL: picture,
        },
        // 2. Updates (Applied to existing users)
        {
          lastLoginAt: new Date(),
          // Only force-update name if it came from the form (Signup), otherwise ignore
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
      await authRepository.updateUser(userId, {
        displayName: data.displayName,
        photoURL: data.photoURL || null,
      });
      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to update profile');
    }
  }

  static async deleteAccount(userId: string): Promise<Result<void>> {
    try {
      await authRepository.deleteFirestoreUser(userId);
      await authRepository.deleteAuthUser(userId);
      await this.logout();
      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.UNKNOWN, 'Failed to delete account');
    }
  }
}
