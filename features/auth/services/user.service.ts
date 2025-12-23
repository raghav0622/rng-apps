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
    data: { displayName?: string; photoUrl?: string; avatarPath?: string },
  ): Promise<Result<void>> {
    try {
      // Fetch current user to check for old avatar
      const currentUser = await userRepository.getUser(uid);

      await userRepository.updateUser(uid, data);

      // Clean up old avatar if a new one is provided and path is known
      if (data.avatarPath && currentUser.avatarPath && data.avatarPath !== currentUser.avatarPath) {
        await StorageService.deleteFileByPath(currentUser.avatarPath);
      }

      // If photoUrl is explicitly set to null/empty (removal), delete old file
      if (data.photoUrl === '' || data.photoUrl === null) {
        if (currentUser.avatarPath) {
          await StorageService.deleteFileByPath(currentUser.avatarPath);
          // Clear path in DB
          await userRepository.updateUser(uid, { avatarPath: '' });
        }
      }

      // Sync basic data to Firebase Auth
      if (data.displayName || data.photoUrl) {
        await auth().updateUser(uid, {
          displayName: data.displayName,
          photoURL: data.photoUrl,
        });
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Update Profile Error', error);
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

      // 2. Soft Delete in Firestore
      await userRepository.softDeleteUser(uid);

      // 3. Disable in Firebase Auth
      await auth().updateUser(uid, { disabled: true });

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Delete Account Error:', error);
      throw new CustomError(AppErrorCode.UNKNOWN_ERROR, 'Failed to delete account');
    }
  }
}
