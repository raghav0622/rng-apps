import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { UserRoleInOrg } from '@/lib/action-policies';
import { SESSION_DURATION_MS } from '@/lib/constants';
import { env } from '@/lib/env';
import { auth } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { SignUpInput, User } from './auth.model';
import { SessionService } from './session.service';
import { userRepository } from './user.repository';

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
        // Rollback Auth User if DB creation fails
        await auth().deleteUser(authUser.uid);
        throw new CustomError(AppErrorCode.INTERNAL_ERROR, 'Failed to create user profile.');
      }
    });
  }

  /**
   * Server-side Login to generate Session Cookie.
   */
  async login(
    email: string,
    password: string,
    userAgent?: string,
    ip?: string,
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

      const expiresIn = SESSION_DURATION_MS; // 5 days
      const sessionCookie = await auth().createSessionCookie(data.idToken, { expiresIn });
      const sessionId = uuidv4();
      
      // Capture Metadata for Session Dashboard
      await SessionService.createSession(data.localId, sessionId, userAgent, ip);

      return { sessionCookie, expiresIn, sessionId };
    });
  }
}

export const authService = new AuthService();
