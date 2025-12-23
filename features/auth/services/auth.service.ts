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

  /**
   * Atomic Signup Transaction
   * Creates Auth User -> Creates DB Profile -> Returns Token
   * or Rolls back completely.
   */
  static async signup(input: SignupInput): Promise<Result<string>> {
    return withErrorHandling(async () => {
      let userUid: string | null = null;

      try {
        // 1. Create Auth User
        const userCredential = await auth().createUser({
          email: input.email,
          password: input.password,
          displayName: input.displayName,
          emailVerified: false,
        });
        userUid = userCredential.uid;

        // 2. Create DB Profile
        await userRepository.signUpUser({
          uid: userUid,
          email: input.email,
          displayName: input.displayName,
        });

        // 3. Generate Token
        return await auth().createCustomToken(userUid);
      } catch (error) {
        // COMPENSATION TRANSACTION
        if (userUid) {
          await this.rollbackAuthUser(userUid);
        }
        throw error;
      }
    });
  }

  // Refactor: Make public if you need to call it from admin panels later
  public static async rollbackAuthUser(uid: string) {
    console.warn(`[AuthService] Initiating rollback for user ${uid}`);
    try {
      await auth().deleteUser(uid);
      // Add: Delete from DB if the DB write partially succeeded
      // await userRepository.deleteUser(uid);
    } catch (e) {
      console.error('[AuthService] CRITICAL: Rollback failed. Manual intervention required.', e);
      // TODO: Push to Sentry/Dead Letter Queue
    }
  }
}
