import { AuditAction } from '@/features/audit/audit.model';
import { auditRepository } from '@/features/audit/audit.repository';
import { UserRoleInOrg } from '@/features/enums';
import { AppErrorCode, CustomError } from '@/lib/errors';
import { firestore } from '@/lib/firebase/admin';
import { logInfo } from '@/lib/logger';
import { Result } from '@/lib/types';
import 'server-only';
import { CreateOrgInput, Organization, UpdateOrgInput } from './org.model';
import { orgRepository } from './org.repository';

export class OrgService {
  /**
   * Creates a new Organization and assigns the creator as the OWNER.
   * Enforces strict Single-Tenancy: User cannot create an org if they already belong to one.
   */
  static async createOrganization(
    userId: string,
    input: CreateOrgInput,
    traceId: string,
  ): Promise<Result<Organization>> {
    const db = firestore();

    try {
      const newOrgId = db.collection('organizations').doc().id;

      await db.runTransaction(async (t) => {
        const userRef = db.collection('users').doc(userId);
        const userSnap = await t.get(userRef);

        if (!userSnap.exists) {
          throw new CustomError(AppErrorCode.NOT_FOUND, 'User profile not found.');
        }

        const userData = userSnap.data();

        // STRICT SINGLE-TENANCY CHECK
        if (userData?.orgId) {
          throw new CustomError(
            AppErrorCode.PERMISSION_DENIED,
            'You are already a member of an organization.',
          );
        }

        // 1. Create Organization
        orgRepository.create(t, newOrgId, {
          name: input.name,
          ownerId: userId,
        });

        // 2. Create Member Record (Owner)
        const memberRef = db
          .collection('organizations')
          .doc(newOrgId)
          .collection('members')
          .doc(userId);

        t.set(memberRef, {
          userId,
          orgId: newOrgId,
          role: UserRoleInOrg.OWNER,
          joinedAt: new Date(),
        });

        // 3. Update User Profile with orgId (Locks them to this org)
        t.update(userRef, { orgId: newOrgId });
      });

      // 4. Audit Log (Async)
      await auditRepository.create({
        action: AuditAction.CREATE,
        resource: 'organization',
        resourceId: newOrgId,
        orgId: newOrgId,
        actorId: userId,
        traceId,
        metadata: { name: input.name },
      });

      logInfo(`Organization Created: ${input.name}`, { orgId: newOrgId, userId, traceId });

      // Fetch and return the fresh org
      const createdOrg = await orgRepository.findById(newOrgId);
      if (!createdOrg) throw new Error('Failed to retrieve created org');

      return { success: true, data: createdOrg };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to create organization.');
    }
  }

  static async updateOrganization(
    userId: string,
    input: UpdateOrgInput,
    traceId: string,
  ): Promise<Result<void>> {
    try {
      const org = await orgRepository.findById(input.orgId);
      if (!org) throw new CustomError(AppErrorCode.NOT_FOUND, 'Organization not found');

      // Authorization: Check if user is the OWNER
      // (Real apps might check specific permissions, here we check Owner ID strictly)
      if (org.ownerId !== userId) {
        throw new CustomError(
          AppErrorCode.PERMISSION_DENIED,
          'Only the owner can update settings.',
        );
      }

      await orgRepository.update(input.orgId, {
        name: input.name,
      });

      await auditRepository.create({
        action: AuditAction.UPDATE,
        resource: 'organization',
        resourceId: input.orgId,
        orgId: input.orgId,
        actorId: userId,
        traceId,
        metadata: input,
      });

      logInfo(`Organization Updated: ${input.orgId}`, { userId, traceId });

      return { success: true, data: undefined };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.DB_ERROR, 'Failed to update organization.');
    }
  }
}
