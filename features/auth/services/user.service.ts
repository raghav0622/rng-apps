import { AppErrorCode, CustomError } from '@/lib/errors';
import { auth } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import 'server-only';
import { userRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';

export class UserService {
  static async updateUserProfile(
    uid: string,
    data: { displayName?: string; photoUrl?: string },
  ): Promise<Result<void>> {
    try {
      await userRepository.updateUser(uid, data);

      // Sync basic data to Firebase Auth
      if (data.displayName || data.photoUrl) {
        await auth().updateUser(uid, {
          displayName: data.displayName,
          photoURL: data.photoUrl,
        });
      }

      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to update profile');
    }
  }

  static async refreshEmailVerificationStatus(uid: string): Promise<Result<boolean>> {
    try {
      const fbUser = await auth().getUser(uid);
      if (fbUser.emailVerified) {
        await userRepository.updateUser(uid, { emailVerified: true });
        return { success: true, data: true };
      }
      return { success: true, data: false };
    } catch (e) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to refresh email verification status');
    }
  }

  static async deleteUserAccount(uid: string): Promise<Result<void>> {
    try {
      // 1. Revoke all sessions immediately
      await SessionService.revokeAllSessions(uid);

      // 2. Soft Delete in Firestore (keeps data for recovery/audit)
      await userRepository.softDeleteUser(uid);

      // 3. Disable in Firebase Auth (prevents new logins/token generation)
      await auth().updateUser(uid, { disabled: true });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Delete Account Error:', error);
      throw new CustomError(AppErrorCode.UNKNOWN_ERROR, 'Failed to delete account');
    }
  }
}
