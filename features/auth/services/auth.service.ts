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

  static async signup({ displayName, email, password }: SignupInput): Promise<Result<string>> {
    return withErrorHandling(async () => {
      // 1. Create User in Firebase Auth
      const userCredential = await auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      try {
        // 2. Create User Profile in Firestore
        // This is critical. If this fails, we have an "Orphaned Account" in Auth but no DB data.
        await userRepository.signUpUser({
          uid: userCredential.uid,
          email,
          displayName,
        });

        // 3. Return Custom Token
        return await auth().createCustomToken(userCredential.uid);
      } catch (dbError) {
        // ROLLBACK: If DB write fails, delete the Auth user to ensure atomicity.
        console.error(`Signup failed at DB layer for ${email}. Rolling back Auth user.`);
        await auth()
          .deleteUser(userCredential.uid)
          .catch((rollbackErr) => {
            console.error('CRITICAL: Failed to rollback user creation', rollbackErr);
          });

        throw dbError; // Re-throw to trigger the standard error handler
      }
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
}
