import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { env } from '@/lib/env';
import { auth } from '@/lib/firebase/admin';
import { logInfo } from '@/lib/logger';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { SignUpInput, User } from '../auth.model';
import { userRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';

class AuthService extends AbstractService {
  async getUserProfile(userId: string) {
    return await userRepository.get(userId);
  }

  /**
   * Registers a new user with the system.
   * Performs dual-write: Firebase Auth (Identity) + Firestore (Data).
   */
  async signup(input: SignUpInput): Promise<Result<User>> {
    return this.handleOperation('auth.signup', async () => {
      // 1. Create Identity in Firebase Auth
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

      // 2. Create Entity in Firestore
      try {
        const newUser = await userRepository.create(authUser.uid, {
          email: input.email,
          displayName: input.displayName,
          photoURL: authUser.photoURL || undefined,
          orgRole: 'NOT_IN_ORG' as any,
          orgId: null,
          isOnboarded: false,
        });

        logInfo(`[AUTH] User created: ${newUser.id}`);
        return newUser;
      } catch (dbError) {
        // Rollback: If DB write fails, delete the Auth user to prevent "Zombie" accounts
        await auth().deleteUser(authUser.uid);
        throw new CustomError(
          AppErrorCode.INTERNAL_ERROR,
          'Failed to create user profile. Please try again.',
        );
      }
    });
  }

  /**
   * Authenticates a user via email and password strictly on the server.
   * Returns a Session Cookie string to be set by the Action.
   */
  // 🛑 FIX: Added 'sessionId' to the return type definition below
  async login(
    email: string,
    password: string,
  ): Promise<Result<{ sessionCookie: string; expiresIn: number; sessionId: string }>> {
    return this.handleOperation('auth.login', async () => {
      // 1. Verify Credentials via Google Identity Toolkit (REST)
      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.NEXT_PUBLIC_FIREBASE_API_KEY}`;

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
          throw new CustomError(AppErrorCode.ACCOUNT_DISABLED, 'This account has been disabled.');
        }
        throw new Error(msg);
      }

      const idToken = data.idToken;
      const uid = data.localId;

      // 2. Create Session Cookie (5 days)
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await auth().createSessionCookie(idToken, { expiresIn });

      // 3. Register Session in Redis
      const sessionId = uuidv4();

      await SessionService.createSession(uid, sessionId);

      return { sessionCookie, expiresIn, sessionId };
    });
  }
}

export const authService = new AuthService();
