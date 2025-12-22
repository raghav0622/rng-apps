import { StorageService } from '@/features/storage/storage.service';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { auth } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import 'server-only';
import { sessionRepository } from '../repositories/session.repository';
import { userRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';

export class UserService {
  static async updateUserProfile(
    uid: string,
    data: { displayName: string; photoUrl?: string },
  ): Promise<Result<void>> {
    try {
      const currentUser = await userRepository.getUser(uid);

      let finalPhotoUrl = currentUser.photoUrl;
      if (data.photoUrl !== undefined) {
        finalPhotoUrl = data.photoUrl;
      }

      await userRepository.updateUser(uid, {
        displayName: data.displayName,
        photoUrl: finalPhotoUrl,
      });

      await auth().updateUser(uid, {
        displayName: data.displayName,
        photoURL: finalPhotoUrl || null,
      });

      if (data.photoUrl && currentUser.photoUrl && data.photoUrl !== currentUser.photoUrl) {
        StorageService.deleteFileByUrl(currentUser.photoUrl).catch((err) =>
          console.warn('Failed to clean up old avatar', err),
        );
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Update Profile Error:', error);
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to update profile');
    }
  }

  static async deleteUserAccount(uid: string): Promise<Result<void>> {
    try {
      try {
        await auth().deleteUser(uid);
      } catch (e: any) {
        if (e.code !== 'auth/user-not-found') throw e;
      }

      try {
        const currentUser = await userRepository.getUser(uid);
        if (currentUser.photoUrl) {
          await StorageService.deleteFileByUrl(currentUser.photoUrl);
        }
      } catch (e) {
        console.warn('Cleanup warning during delete', e);
      }

      await sessionRepository.revokeAllUserSessions(uid);
      await userRepository.deleteUser(uid);
      await SessionService.logout();

      return { success: true, data: undefined };
    } catch (error) {
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to delete account');
    }
  }

  // --- NEWLY ADDED METHOD ---

  static async refreshEmailVerificationStatus(uid: string): Promise<Result<{ verified: boolean }>> {
    try {
      const firebaseUser = await auth().getUser(uid);
      const isVerified = firebaseUser.emailVerified;

      if (isVerified) {
        await userRepository.updateUser(uid, { emailVerified: true });
      }

      return { success: true, data: { verified: isVerified } };
    } catch (error) {
      console.error('Sync Error:', error);
      return { success: true, data: { verified: false } };
    }
  }
}
