import { AppErrorCode, CustomError } from '@/lib/errors';
import { auth } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import 'server-only';
import { SignupInput } from '../auth.model';
import { userRepository } from '../repositories/user.repository';
import { AuthApiProvider } from './auth-api.provider';
import { SessionService } from './session.service';

/**
 * DRY Wrapper to standardize error handling across Auth services.
 */
async function withErrorHandling<T>(operation: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error: any) {
    if (error instanceof CustomError) throw error;
    // Wrap unknown errors
    throw new CustomError(
      AppErrorCode.UNKNOWN_ERROR,
      error.message || 'An unexpected error occurred',
    );
  }
}

export class AuthService {
  static async verifyEmail(oobCode: string): Promise<Result<void>> {
    return withErrorHandling(async () => {
      await AuthApiProvider.verifyEmailCode(oobCode);
    });
  }

  static async confirmPasswordReset(oobCode: string, newPassword: string): Promise<Result<void>> {
    return withErrorHandling(async () => {
      await AuthApiProvider.resetPassword(oobCode, newPassword);
    });
  }

  static async signin({ email }: { email: string }): Promise<Result<string>> {
    return withErrorHandling(async () => {
      const userProfile = await userRepository.getUserByEmail(email);
      // Generate Custom Token for client-side sign-in
      return await auth().createCustomToken(userProfile.uid);
    });
  }

  static async changePassword(
    uid: string,
    email: string,
    oldPw: string,
    newPw: string,
  ): Promise<Result<void>> {
    return withErrorHandling(async () => {
      if (!email) throw new CustomError(AppErrorCode.INVALID_INPUT, 'User has no email');

      // 1. Verify old password using Provider
      const isVerified = await AuthApiProvider.verifyPassword(email, oldPw);
      if (!isVerified) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Incorrect current password');
      }

      // 2. Update password via Admin SDK
      await auth().updateUser(uid, { password: newPw });

      // 3. Security: Revoke all existing sessions to force re-login on all devices
      await SessionService.revokeAllSessions(uid);
    });
  }

  static async signup(input: SignupInput): Promise<Result<string>> {
    return withErrorHandling(async () => {
      // 1. Create Auth User
      const userCredential = await auth().createUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        emailVerified: false,
      });

      // 2. Create DB Profile with Automatic Rollback Support
      try {
        await userRepository.signUpUser({
          uid: userCredential.uid,
          email: input.email,
          displayName: input.displayName,
        });
      } catch (dbError) {
        await this.rollbackAuthUser(userCredential.uid);
        throw dbError;
      }

      return await auth().createCustomToken(userCredential.uid);
    });
  }

  private static async rollbackAuthUser(uid: string) {
    console.error(`Rolling back user ${uid}`);
    try {
      await auth().deleteUser(uid);
    } catch (e) {
      console.error('CRITICAL: Rollback failed', e);
      // Ideally, send this to an error reporting service (Sentry)
    }
  }
}
