import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { UserRoleInOrg } from '@/lib/action-policies';
import { SESSION_DURATION_MS } from '@/lib/constants';
import { EMAIL_FROM, resend } from '@/lib/email';
import { env } from '@/lib/env';
import { auth } from '@/lib/firebase/admin';
import { redisClient } from '@/lib/redis';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { SignUpInput, User } from './auth.model';
import { SessionService } from './session.service';
import { userRepository } from './user.repository';

const GOOGLE_API_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';
const MAGIC_LINK_EXPIRY = 60 * 15; // 15 minutes

export type MagicLinkResult = {
  type: 'success';
  sessionCookie: string;
  expiresIn: number;
  sessionId: string;
};

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

      const expiresIn = SESSION_DURATION_MS;
      const sessionCookie = await auth().createSessionCookie(data.idToken, { expiresIn });
      const sessionId = uuidv4();

      await SessionService.createSession(data.localId, sessionId, userAgent, ip);

      return { sessionCookie, expiresIn, sessionId };
    });
  }

  /**
   * Request Magic Link (Only for Existing Users)
   */
  async requestMagicLink(email: string): Promise<Result<void>> {
    return this.handleOperation('auth.requestMagicLink', async () => {
      // 1. Check if user exists first.
      const user = await userRepository.getByEmail(email);
      if (!user) {
        // Silently fail to prevent email enumeration attacks.
        return;
      }

      const token = randomBytes(32).toString('hex');
      const key = `magic:token:${token}`;

      await redisClient.set(key, email, { ex: MAGIC_LINK_EXPIRY });

      const magicLink = `${env.NEXT_PUBLIC_APP_URL}/magic-link?token=${token}`;

      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Sign in to RNG App',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Sign in to RNG App</h2>
            <p>Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
            <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Sign in now</a>
            <p style="margin-top: 24px; color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    });
  }

  /**
   * Verify Magic Link and Login (Sign-In ONLY)
   */
  async verifyMagicLink(
    token: string,
    userAgent?: string,
    ip?: string,
  ): Promise<Result<MagicLinkResult>> {
    return this.handleOperation('auth.verifyMagicLink', async () => {
      const key = `magic:token:${token}`;

      const email = await redisClient.get<string>(key);
      if (!email) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired magic link.');
      }

      // Cleanup token immediately (one-time use)
      await redisClient.del(key);

      // 2. Get User - MUST exist
      let authUser;
      try {
        authUser = await auth().getUserByEmail(email);
      } catch (e: any) {
        // This should not happen if requestMagicLink is working correctly, but as a safeguard:
        throw new CustomError(AppErrorCode.NOT_FOUND, 'Account not found. Please sign up first.');
      }

      // 3. Token Exchange for Session Cookie
      const customToken = await auth().createCustomToken(authUser.uid);
      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
      
      const response = await fetch(signInUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Authentication failed');

      const expiresIn = SESSION_DURATION_MS;
      const sessionCookie = await auth().createSessionCookie(data.idToken, { expiresIn });
      const sessionId = uuidv4();

      await SessionService.createSession(authUser.uid, sessionId, userAgent, ip);

      return { type: 'success', sessionCookie, expiresIn, sessionId };
    });
  }
}

export const authService = new AuthService();
