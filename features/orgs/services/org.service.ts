import { userRepository } from '@/features/auth/repositories/user.repository';
import { UserRoleInOrg } from '@/features/enums';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { firestore } from '@/lib/firebase/admin';
import { serializeFirestoreData } from '@/lib/firebase/utils';
import { Result } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import 'server-only';
import { CreateOrgInput, Organization } from '../org.model';
import { orgRepository } from '../repositories/org.repository';

export class OrgService {
  /**
   * Creates a new organization and links the creator as the OWNER.
   * ENFORCES: Single Tenancy (User must not be in an org).
   */
  static async createOrganization(
    userId: string,
    input: CreateOrgInput,
  ): Promise<Result<Organization>> {
    try {
      const user = await userRepository.getUser(userId);
      if (user.orgId) {
        throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Already in an organization.');
      }

      const userRef = firestore().collection('users').doc(userId);

      const createdOrg = await firestore().runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        if (userDoc.data()?.orgId) {
          throw new CustomError(
            AppErrorCode.PERMISSION_DENIED,
            'Race condition: User already joined.',
          );
        }

        // Create Org
        const newOrg = await orgRepository.create({ ...input, ownerId: userId }, t);

        // Update User (Link Org + Set Onboarded)
        t.update(userRef, {
          orgId: newOrg.id,
          orgRole: UserRoleInOrg.OWNER,
          onboarded: true, // <--- FIX: Set onboarded
          updatedAt: Timestamp.now(),
        });

        return newOrg;
      });

      return { success: true, data: serializeFirestoreData(createdOrg) }; // <--- FIX: Sanitize
    } catch (error: any) {
      if (error instanceof CustomError) return { success: false, error: error.toAppError() };
      return {
        success: false,
        error: new CustomError(AppErrorCode.UNKNOWN, 'Failed to create org').toAppError(),
      };
    }
  }

  static async updateOrganization(
    orgId: string,
    data: Partial<Organization>,
  ): Promise<Result<void>> {
    try {
      const { id, ...updateData } = data; // Prevent updating ID
      await orgRepository.update(orgId, updateData);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new CustomError(AppErrorCode.UNKNOWN, 'Failed to update organization').toAppError(),
      };
    }
  }
}
