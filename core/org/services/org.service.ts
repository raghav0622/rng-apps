import { userRepository } from '@/core/auth/repositories/user.repository';
import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { UserRoleInOrg } from '@/lib/action-policies';
import { firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrgInput, Organization, UpdateOrgInput } from '../org.model';
import { organizationRepository } from '../org.repository';

class OrganizationService extends AbstractService {
  /**
   * Creates a new organization and assigns the current user as the OWNER.
   */
  async createOrganization(userId: string, input: CreateOrgInput): Promise<Result<Organization>> {
    return this.handleOperation('org.create', async () => {
      let newOrg: Organization;

      // 1. Run Transaction
      await firestore().runTransaction(async (t) => {
        const userRepoT = userRepository.withTransaction(t);
        const orgRepoT = organizationRepository.withTransaction(t);

        // Strict Tenancy Check
        const user = await userRepoT.get(userId);
        if (user.orgId) {
          throw new CustomError(
            AppErrorCode.PERMISSION_DENIED,
            'You are already a member of an organization.',
          );
        }

        // Create Organization
        const orgId = uuidv4();
        newOrg = await orgRepoT.create(orgId, {
          name: input.name,
          ownerId: userId,
        });

        // Update User Context
        await userRepoT.update(userId, {
          orgId: orgId,
          orgRole: UserRoleInOrg.OWNER,
          isOnboarded: true,
        });
      });

      // 2. 🛑 CRITICAL FIX: Clear User Cache
      // Since the transaction updated the user 'behind the back' of the cache,
      // we must invalidate it so the Layout fetches the new 'orgId'.
      await userRepository.clearCache(userId);

      return newOrg!;
    });
  }

  // ... (updateOrganization and getOrganization remain unchanged)
  async updateOrganization(orgId: string, input: UpdateOrgInput): Promise<Result<void>> {
    return this.handleOperation('org.update', async () => {
      await organizationRepository.update(orgId, input);
    });
  }

  async getOrganization(orgId: string): Promise<Result<Organization>> {
    return this.handleOperation('org.get', async () => {
      return await organizationRepository.get(orgId);
    });
  }
}

export const organizationService = new OrganizationService();
