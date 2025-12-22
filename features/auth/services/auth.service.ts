import { AppErrorCode, CustomError } from '@/lib/errors';
import { auth } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import 'server-only';
import { SignupInput } from '../auth.model';
import { userRepository } from '../repositories/user.repository';
import { AuthApiProvider } from './auth-api.provider';
import { SessionService } from './session.service';

export class AuthService {
  static async verifyEmail(oobCode: string): Promise<Result<void>> {
    try {
      await AuthApiProvider.verifyEmailCode(oobCode);
      return { success: true, data: undefined };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired verification code');
    }
  }

  static async confirmPasswordReset(oobCode: string, newPassword: string): Promise<Result<void>> {
    try {
      await AuthApiProvider.resetPassword(oobCode, newPassword);
      return { success: true, data: undefined };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Invalid or expired reset code');
    }
  }

  static async signin({ email }: { email: string }): Promise<Result<string>> {
    try {
      const userProfile = await userRepository.getUserByEmail(email);
      // Generate Custom Token for client-side sign-in
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

  static async changePassword(
    uid: string,
    email: string,
    oldPw: string,
    newPw: string,
  ): Promise<Result<void>> {
    try {
      if (!email) throw new CustomError(AppErrorCode.INVALID_INPUT, 'User has no email');

      // 1. Verify old password using Provider
      const isVerified = await AuthApiProvider.verifyPassword(email, oldPw);
      if (!isVerified) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Incorrect current password');
      }

      // 2. Update password via Admin SDK
      await auth().updateUser(uid, { password: newPw });

      // 3. Security: Revoke all existing sessions
      await SessionService.revokeAllSessions(uid);

      return { success: true, data: undefined };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.INVALID_INPUT, 'Failed to update password');
    }
  }
}
