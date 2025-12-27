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

export type GoogleSignInResult = 
  | { type: 'success'; sessionCookie: string; expiresIn: number; sessionId: string }
  | { type: 'password_required'; email: string; name: string; picture: string; idToken: string };

export type MagicLinkResult = 
  | { type: 'success'; sessionCookie: string; expiresIn: number; sessionId: string }
  | { type: 'password_required'; email: string; token: string };

class AuthService extends AbstractService {
  /**
   * Generates a secure random password.
   */
  private generateSecurePassword(): string {
    return randomBytes(16).toString('hex') + 'A1!'; // Ensure complexity
  }

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
   * Handle Google Sign-In with Account Linking and Mandatory Password for new users.
   */
  async handleGoogleSignIn(
    idToken: string,
    password?: string,
    userAgent?: string,
    ip?: string,
  ): Promise<Result<GoogleSignInResult>> {
    return this.handleOperation('auth.googleSignIn', async () => {
      // 1. Verify the ID Token from client
      const decodedToken = await auth().verifyIdToken(idToken);
      const { uid, email, name, picture } = decodedToken;

      if (!email) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Google account missing email.');
      }

      // 2. Check if user exists in Firestore
      let user = await userRepository.get(uid);
      if (!user) {
        user = await userRepository.getByEmail(email);
      }

      if (user) {
        // EXISTING USER FLOW
        const expiresIn = SESSION_DURATION_MS;
        const sessionCookie = await auth().createSessionCookie(idToken, { expiresIn });
        const sessionId = uuidv4();
        await SessionService.createSession(user.id, sessionId, userAgent, ip);
        return { type: 'success', sessionCookie, expiresIn, sessionId };
      }

      // NEW USER FLOW
      if (!password) {
        return {
          type: 'password_required',
          email,
          name: name || '',
          picture: picture || '',
          idToken,
        };
      }

      // Complete registration with password
      await auth().updateUser(uid, {
        password: password,
        emailVerified: true,
      });

      const newUser = await userRepository.create(uid, {
        email: email,
        displayName: name || '',
        photoURL: picture || undefined,
        orgRole: UserRoleInOrg.NOT_IN_ORG,
        orgId: null,
        isOnboarded: false,
      });

      const expiresIn = SESSION_DURATION_MS;
      const sessionCookie = await auth().createSessionCookie(idToken, { expiresIn });
      const sessionId = uuidv4();
      await SessionService.createSession(newUser.id, sessionId, userAgent, ip);
      return { type: 'success', sessionCookie, expiresIn, sessionId };
    });
  }

  /**
   * Links a Google ID token to an existing authenticated user.
   */
  async linkGoogleAccount(userId: string, idToken: string): Promise<Result<void>> {
    return this.handleOperation('auth.linkGoogle', async () => {
      const decodedToken = await auth().verifyIdToken(idToken);
      const { picture, name } = decodedToken;
      
      await userRepository.update(userId, {
        photoURL: picture,
        displayName: name,
      });
    });
  }

  /**
   * Request Magic Link (Redis Token + Resend Email)
   */
  async requestMagicLink(email: string): Promise<Result<void>> {
    return this.handleOperation('auth.requestMagicLink', async () => {
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
   * Verify Magic Link and Login (Auto-Signup + Password Set Requirement)
   */
  async verifyMagicLink(
    token: string,
    password?: string,
    userAgent?: string,
    ip?: string,
  ): Promise<Result<MagicLinkResult>> {
    return this.handleOperation('auth.verifyMagicLink', async () => {
      const key = `magic:token:${token}`;

      // 1. Validate Token
      const email = await redisClient.get<string>(key);
      if (!email) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired magic link.');
      }

      // 2. Get or Create User
      let authUserUid: string;
      try {
        const authUser = await auth().getUserByEmail(email);
        authUserUid = authUser.uid;
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          // NEW USER flow for magic link
          if (!password) {
            return { type: 'password_required', email, token };
          }

          // Complete registration with provided password
          const newAuthUser = await auth().createUser({
            email,
            emailVerified: true,
            password: password,
          });

          await userRepository.create(newAuthUser.uid, {
            email,
            orgRole: UserRoleInOrg.NOT_IN_ORG,
            orgId: null,
            isOnboarded: false,
          });
          
          authUserUid = newAuthUser.uid;
        } else {
          throw e;
        }
      }

      // 3. Cleanup Token
      await redisClient.del(key);

      // 4. Token Exchange for Session Cookie
      const customToken = await auth().createCustomToken(authUserUid);
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

      await SessionService.createSession(authUserUid, sessionId, userAgent, ip);

      return { type: 'success', sessionCookie, expiresIn, sessionId };
    });
  }
}

export const authService = new AuthService();
