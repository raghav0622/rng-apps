import { AbstractService } from '@/core/abstract-service/AbstractService';
import { UserRoleInOrg } from '@/core/action-policies';
import { SESSION_DURATION_MS } from '@/core/constants';
import { EMAIL_FROM, resend } from '@/core/email';
import { env } from '@/lib/env';
import { auth } from '@/lib/firebase/admin';
import { redisClient } from '@/lib/redis';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/core/utils/errors';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { SignUpInput, User } from './auth.model';
import { SessionService } from './session.service';
import { userRepository } from './user.repository';
import { storageProvider } from '@/core/storage';
import { ProfileUpdateInput } from './profile.actions';

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

  /**
   * Update user profile (display name and/or photo)
   * - Automatically deletes old photo when uploading new one
   * - Supports removing photo
   */
  async updateUserProfile(userId: string, input: ProfileUpdateInput): Promise<Result<User>> {
    return this.handleOperation('auth.updateProfile', async () => {
      // Get current user
      const user = await userRepository.get(userId);
      if (!user) {
        throw new CustomError(AppErrorCode.NOT_FOUND, 'User not found.');
      }

      const updates: Partial<User> = {};
      let newPhotoURL: string | undefined;

      // Handle photo removal
      if (input.removePhoto && user.photoURL) {
        try {
          // Extract path from URL and delete
          const path = this.extractStoragePath(user.photoURL);
          if (path) {
            await storageProvider.delete(path);
          }
        } catch (error) {
          console.error('Failed to delete old photo:', error);
          // Continue even if deletion fails
        }
        updates.photoURL = undefined;
        newPhotoURL = undefined;
      }
      // Handle photo upload
      else if (input.photoFile) {
        // Delete old photo if exists
        if (user.photoURL) {
          try {
            const path = this.extractStoragePath(user.photoURL);
            if (path) {
              await storageProvider.delete(path);
            }
          } catch (error) {
            console.error('Failed to delete old photo:', error);
            // Continue with upload even if deletion fails
          }
        }

        // Upload new photo
        const extension = input.photoFile.name.split('.').pop() || 'jpg';
        const storagePath = `users/${userId}/profile-photo.${extension}`;
        
        const uploadResult = await storageProvider.upload(
          storagePath,
          input.photoFile,
          {
            contentType: input.photoFile.type,
            metadata: {
              uploadedBy: userId,
              uploadedAt: new Date().toISOString(),
            },
          }
        );

        if (!uploadResult.success) {
          throw new CustomError(AppErrorCode.INTERNAL_ERROR, 'Failed to upload photo.');
        }

        newPhotoURL = uploadResult.url;
        updates.photoURL = newPhotoURL;
      }

      // Handle display name update
      if (input.displayName !== undefined) {
        updates.displayName = input.displayName;
      }

      // Update Firestore
      const updatedUser = await userRepository.update(userId, updates);

      // Sync with Firebase Auth
      try {
        const authUpdates: any = {};
        if (updates.displayName !== undefined) {
          authUpdates.displayName = updates.displayName;
        }
        if (updates.photoURL !== undefined) {
          authUpdates.photoURL = updates.photoURL || null;
        }
        
        if (Object.keys(authUpdates).length > 0) {
          await auth().updateUser(userId, authUpdates);
        }
      } catch (error) {
        console.error('Failed to sync with Firebase Auth:', error);
        // Rollback Firestore changes if Auth update fails
        await userRepository.update(userId, {
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        throw new CustomError(AppErrorCode.INTERNAL_ERROR, 'Failed to update profile.');
      }

      return updatedUser;
    });
  }

  /**
   * Extract storage path from full URL
   */
  private extractStoragePath(url: string): string | null {
    try {
      // Handle Firebase Storage URLs
      if (url.includes('firebasestorage.googleapis.com')) {
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
        if (pathMatch) {
          return decodeURIComponent(pathMatch[1]);
        }
      }
      // Handle custom storage URLs
      const pathMatch = url.match(/\/storage\/(.+)$/);
      if (pathMatch) {
        return pathMatch[1];
      }
      return null;
    } catch (error) {
      console.error('Failed to extract storage path:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
