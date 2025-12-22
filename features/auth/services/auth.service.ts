import { AppErrorCode, CustomError } from '@/lib/errors';
import { auth } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import 'server-only';
import { SignupInput } from '../auth.model';
import { userRepository } from '../repositories/user.repository';
import { SessionService } from './session.service'; // Needed for revoking sessions

export class AuthService {
  /**
   * Helper: Call Firebase REST API
   */
  private static async callAuthApi(endpoint: string, body: object) {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY');

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      throw new CustomError(AppErrorCode.INVALID_INPUT, data.error?.message || 'Auth API Error');
    }
    return data;
  }

  /**
   * Helper: Verify password using Firebase REST API
   */
  private static async verifyPassword(email: string, password: string): Promise<boolean> {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY');

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );

    const data = await response.json();
    if (!response.ok || data.error) return false;
    return true;
  }

  static async verifyEmail(oobCode: string): Promise<Result<void>> {
    try {
      await this.callAuthApi('update', { oobCode });
      return { success: true, data: undefined };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired verification code');
    }
  }

  static async confirmPasswordReset(oobCode: string, newPassword: string): Promise<Result<void>> {
    try {
      await this.callAuthApi('resetPassword', { oobCode, newPassword });
      return { success: true, data: undefined };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired reset code');
    }
  }

  static async signin({ email }: { email: string }): Promise<Result<string>> {
    try {
      const userProfile = await userRepository.getUserByEmail(email);
      const customToken = await auth().createCustomToken(userProfile.uid);
      return { success: true, data: customToken };
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

      await userRepository.signUpUser({
        uid: userCredential.uid,
        email,
        displayName,
      });

      const customToken = await auth().createCustomToken(userCredential.uid);
      return { success: true, data: customToken };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, error.message);
    }
  }

  // --- NEWLY ADDED METHOD ---

  static async changePassword(
    uid: string,
    email: string,
    oldPw: string,
    newPw: string,
  ): Promise<Result<void>> {
    try {
      if (!email) throw new CustomError(AppErrorCode.INVALID_INPUT, 'User has no email');

      const isVerified = await this.verifyPassword(email, oldPw);
      if (!isVerified) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Incorrect current password');
      }

      await auth().updateUser(uid, { password: newPw });

      // Revoke all sessions (Security Best Practice)
      await SessionService.revokeAllSessions(uid);

      return { success: true, data: undefined };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Failed to update password');
    }
  }
}
