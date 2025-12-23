import { StorageService } from '@/features/storage/storage.service';
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
      // 1. Fetch current user to get the old photo URL (before updating)
      const currentUser = await userRepository.getUser(uid);
      const oldPhotoUrl = currentUser.photoUrl;

      // 2. Update Database (assumes Repository handles undefined filtering)
      await userRepository.updateUser(uid, data);

      // 3. Sync to Firebase Auth
      const authUpdate: { displayName?: string; photoURL?: string | null } = {};

      if (data.displayName) authUpdate.displayName = data.displayName;

      // Handle Photo URL for Auth Sync
      if (data.photoUrl !== undefined) {
        authUpdate.photoURL = data.photoUrl === '' ? null : data.photoUrl;
      }

      if (Object.keys(authUpdate).length > 0) {
        await auth().updateUser(uid, authUpdate);
      }

      // 4. Cleanup: Delete old avatar from storage if changed or removed
      if (oldPhotoUrl && data.photoUrl !== undefined && oldPhotoUrl !== data.photoUrl) {
        try {
          await StorageService.deleteFileByUrl(oldPhotoUrl);
        } catch (error) {
          console.warn('Failed to cleanup old avatar:', error);
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error(error);
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
      // 1. Fetch user data first to get the photoUrl
      const user = await userRepository.getUserIncludeDeleted(uid);

      // 2. Revoke all sessions immediately
      await SessionService.revokeAllSessions(uid);

      // 3. Soft/Hard Delete in Firestore
      await userRepository.forceDeleteUser(uid);

      // 4. Disable/Delete in Firebase Auth
      await auth().deleteUser(uid);

      // 5. Cleanup Avatar (if one existed)
      if (user?.photoUrl) {
        try {
          await StorageService.deleteFileByUrl(user.photoUrl);
        } catch (error) {
          console.warn('Failed to delete user avatar during account deletion:', error);
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Delete Account Error:', error);
      throw new CustomError(AppErrorCode.UNKNOWN_ERROR, 'Failed to delete account');
    }
  }
}
