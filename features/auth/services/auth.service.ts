import { AppErrorCode, CustomError } from '@/lib/errors';
import { auth } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import 'server-only';
import { SignupInput } from '../auth.model';
import { userRepository } from '../repositories/user.repository';
import { AuthApiProvider } from './auth-api.provider';
import { SessionService } from './session.service';

async function withErrorHandling<T>(operation: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error: any) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      AppErrorCode.UNKNOWN_ERROR,
      error.message || 'An unexpected error occurred',
    );
  }
}

export class AuthService {
  static async verifyEmail(oobCode: string): Promise<Result<void>> {
    return withErrorHandling(async () => {
      const email = await AuthApiProvider.verifyEmailCode(oobCode);
      if (email) {
        const user = await userRepository.getUserByEmail(email);
        if (user) await userRepository.updateUser(user.uid, { emailVerified: true });
      }
    });
  }

  static async confirmPasswordReset(oobCode: string, newPassword: string): Promise<Result<void>> {
    return withErrorHandling(async () => {
      const email = await AuthApiProvider.resetPassword(oobCode, newPassword);
      if (email) {
        const user = await userRepository.getUserByEmail(email);
        if (user) await SessionService.revokeAllSessions(user.uid);
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

      const isVerified = await AuthApiProvider.verifyPassword(email, oldPw);
      if (!isVerified) {
        throw new CustomError(AppErrorCode.INVALID_INPUT, 'Incorrect current password');
      }

      await auth().updateUser(uid, { password: newPw });
      await SessionService.revokeAllSessions(uid);
    });
  }

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
          disabled: false,
        });
        userUid = userCredential.uid;

        // 2. Create DB Profile
        await userRepository.signUpUser({
          uid: userUid,
          email: input.email,
          displayName: input.displayName,
        });

        // 3. Generate Token
        const customToken = await auth().createCustomToken(userUid);
        return customToken;
      } catch (error) {
        // ROBUST ROLLBACK
        if (userUid) {
          await this.rollbackAuthUser(userUid);
        }
        throw error;
      }
    });
  }

  public static async rollbackAuthUser(uid: string) {
    console.warn(`[AuthService] Initiating rollback for user ${uid}`);
    try {
      await auth().deleteUser(uid);
      await userRepository.forceDeleteUser(uid);
    } catch (e) {
      console.error('[AuthService] CRITICAL: Rollback failed.', e);
    }
  }
}
