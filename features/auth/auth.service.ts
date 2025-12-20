import 'server-only';

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

      const customToken = await auth().createCustomToken(userCredential.uid, {
        displayName: userCredential.displayName,
        onboarded: false,
        orgRole: UserRoleInOrg.NOT_IN_ORG,
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

      // 1. Create Firebase Session Cookie (The Auth Token)
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const authSessionCookie = await authRepository.createSessionCookie(idToken, expiresIn);

      // 2. Create Database Session Record
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

      // 3. Set Cookies
      const cookieStore = await cookies();

      // The Firebase Auth Cookie
      cookieStore.set(AUTH_SESSION_COOKIE_NAME, authSessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });

      // The DB Tracking Cookie
      cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, {
        maxAge: expiresIn,
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
        // Verify cookie to get UID so we know which subcollection to access
        // Use verification with checkRevoked: false just to get the UID safely
        const claims = await authRepository.verifySessionCookie(sessionCookie);
        await authRepository.deleteSessionRecord(claims.uid, sessionId);
      } catch (e) {
        // Token might be expired already, proceed to clear cookies
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
}
