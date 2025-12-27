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

  /**
   * Handle Google Sign-In (Server Side Verification + Dual Write)
   */
  async handleGoogleSignIn(
    idToken: string,
    userAgent?: string,
    ip?: string,
  ): Promise<Result<{ sessionCookie: string; expiresIn: number; sessionId: string }>> {
    return this.handleOperation('auth.googleSignIn', async () => {
      // 1. Verify the ID Token from Google
      const decodedToken = await auth().verifyIdToken(idToken);
      const { uid, email, name, picture, email_verified } = decodedToken;

      if (!email) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Google account missing email.');
      }

      // 2. Check if user already exists in Firestore
      let user = await userRepository.get(uid);

      if (!user) {
        // First time Google Sign-In -> Dual Write
        try {
          user = await userRepository.create(uid, {
            email: email,
            displayName: name || '',
            photoURL: picture || undefined,
            orgRole: UserRoleInOrg.NOT_IN_ORG,
            orgId: null,
            isOnboarded: false,
          });
        } catch (dbError) {
          // If Firestore fails, we might still have the Auth user.
          // Firebase creates the Auth user automatically on the client when signInWithPopup is called.
          throw new CustomError(AppErrorCode.INTERNAL_ERROR, 'Failed to sync user profile.');
        }
      }

      // 3. Generate Session Cookie
      const expiresIn = SESSION_DURATION_MS;
      const sessionCookie = await auth().createSessionCookie(idToken, { expiresIn });
      const sessionId = uuidv4();

      await SessionService.createSession(uid, sessionId, userAgent, ip);

      return { sessionCookie, expiresIn, sessionId };
    });
  }

  /**
   * Request Magic Link (Redis Token + Resend Email)
   */
  async requestMagicLink(email: string): Promise<Result<void>> {
    return this.handleOperation('auth.requestMagicLink', async () => {
      // 1. Generate Secure Token
      const token = randomBytes(32).toString('hex');
      const key = `magic:token:${token}`;

      // 2. Store in Redis with TTL
      await redisClient.set(key, email, { ex: MAGIC_LINK_EXPIRY });

      // 3. Send Email via Resend
      const magicLink = `${env.NEXT_PUBLIC_APP_URL}/magic-link?token=${token}`;

      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Sign in to RNG App',
        html: `
          <p>Click the link below to sign in to your account. This link expires in 15 minutes.</p>
          <p><a href="${magicLink}"><strong>Sign in to RNG App</strong></a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    });
  }

  /**
   * Verify Magic Link and Login
   */
  async verifyMagicLink(
    token: string,
    userAgent?: string,
    ip?: string,
  ): Promise<Result<{ sessionCookie: string; expiresIn: number; sessionId: string }>> {
    return this.handleOperation('auth.verifyMagicLink', async () => {
      const key = `magic:token:${token}`;

      // 1. Validate Token
      const email = await redisClient.get<string>(key);
      if (!email) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired magic link.');
      }

      // 2. Cleanup Token (One-time use)
      await redisClient.del(key);

      // 3. Get or Create User
      let authUser;
      try {
        authUser = await auth().getUserByEmail(email);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          // Auto-Signup for new users
          authUser = await auth().createUser({
            email,
            emailVerified: true, // They verified by clicking the link
          });

          await userRepository.create(authUser.uid, {
            email,
            orgRole: UserRoleInOrg.NOT_IN_ORG,
            orgId: null,
            isOnboarded: false,
          });
        } else {
          throw e;
        }
      }

      // 4. Generate Session Cookie
      // Since we don't have an ID Token from the client here, we create a custom token
      // and use it to get an ID Token via REST API to then create a session cookie.
      // Alternatively, we can just use createCustomToken and have the client sign in.
      // But for a pure server-side flow, we'll do this:
      const customToken = await auth().createCustomToken(authUser.uid);

      // Exchange Custom Token for ID Token
      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
      const response = await fetch(signInUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || 'Token exchange failed');

      const expiresIn = SESSION_DURATION_MS;
      const sessionCookie = await auth().createSessionCookie(data.idToken, { expiresIn });
      const sessionId = uuidv4();

      await SessionService.createSession(authUser.uid, sessionId, userAgent, ip);

      return { sessionCookie, expiresIn, sessionId };
    });
  }
}

export const authService = new AuthService();
