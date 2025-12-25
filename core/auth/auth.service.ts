import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { UserRoleInOrg } from '@/lib/action-policies';
import { env } from '@/lib/env';
import { auth } from '@/lib/firebase/admin';
import { logInfo } from '@/lib/logger';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories/user.repository';
import { SignUpInput, User } from './auth.model';
import { SessionService } from './session.service';

// Google Identity Toolkit API Endpoint
const GOOGLE_API_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

class AuthService extends AbstractService {
  /**
   * Registers a new user (Dual Write: Auth + Firestore).
   */
  async signup(input: SignUpInput): Promise<Result<User>> {
    return this.handleOperation('auth.signup', async () => {
      let authUser;
      try {
        authUser = await auth().createUser({
          email: input.email,
          password: input.password,
          displayName: input.displayName,
          emailVerified: false,
          disabled: false,
        });
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          throw new CustomError(AppErrorCode.ALREADY_EXISTS, 'Email is already registered.');
        }
        throw error;
      }

      try {
        const newUser = await userRepository.create(authUser.uid, {
          email: input.email,
          displayName: input.displayName,
          photoURL: authUser.photoURL || undefined,
          orgRole: UserRoleInOrg.NOT_IN_ORG,
          orgId: null,
          isOnboarded: false,
        });
        return newUser;
      } catch (dbError) {
        await auth().deleteUser(authUser.uid);
        throw new CustomError(AppErrorCode.INTERNAL_ERROR, 'Failed to create user profile.');
      }
    });
  }

  /**
   * Server-side Login.
   */
  async login(
    email: string,
    password: string,
  ): Promise<Result<{ sessionCookie: string; expiresIn: number; sessionId: string }>> {
    return this.handleOperation('auth.login', async () => {
      const signInUrl = `${GOOGLE_API_URL}:signInWithPassword?key=${env.NEXT_PUBLIC_FIREBASE_API_KEY}`;

      const response = await fetch(signInUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error?.message || 'Authentication failed';
        if (msg.includes('INVALID_LOGIN_CREDENTIALS') || msg.includes('INVALID_PASSWORD')) {
          throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid email or password.');
        }
        if (msg.includes('USER_DISABLED')) {
          throw new CustomError(AppErrorCode.ACCOUNT_DISABLED, 'Account disabled.');
        }
        throw new Error(msg);
      }

      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const sessionCookie = await auth().createSessionCookie(data.idToken, { expiresIn });
      const sessionId = uuidv4();
      await SessionService.createSession(data.localId, sessionId);

      return { sessionCookie, expiresIn, sessionId };
    });
  }

  /**
   * Sends a password reset email via Firebase.
   */
  async sendPasswordResetLink(email: string): Promise<Result<void>> {
    return this.handleOperation('auth.forgotPassword', async () => {
      try {
        const link = await auth().generatePasswordResetLink(email);
        logInfo(`[AUTH] Password Reset Link for ${email}: ${link}`);
        // TODO: await emailService.sendForgotPassword(email, link);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          return;
        }
        throw e;
      }
    });
  }

  /**
   * Resets password using OOB code via REST API.
   */
  async resetPassword(oobCode: string, newPassword: string): Promise<Result<void>> {
    return this.handleOperation('auth.resetPassword', async () => {
      const url = `${GOOGLE_API_URL}:resetPassword?key=${env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new CustomError(
          AppErrorCode.INVALID_INPUT,
          data.error?.message || 'Failed to reset password.',
        );
      }
    });
  }

  /**
   * Verifies email using OOB code via REST API.
   */
  async verifyEmail(oobCode: string): Promise<Result<void>> {
    return this.handleOperation('auth.verifyEmail', async () => {
      const url = `${GOOGLE_API_URL}:setAccountInfo?key=${env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode, emailVerified: true }),
      });

      if (!response.ok) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired verification code.');
      }
    });
  }
}

export const authService = new AuthService();
