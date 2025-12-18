import { UserRole } from './enums';
import { AppErrorCode, CustomError } from './errors';
import { OrgContext } from './types';

/**
 * Centralized Action Policies
 * Encapsulates logic for permissions and feature flags.
 */

export const policies = {
  /**
   * RBAC: Ensure user has one of the required roles.
   */
  hasRole: (ctx: OrgContext, requiredRoles: UserRole[]) => {
    if (!requiredRoles.includes(ctx.role as UserRole)) {
      throw new CustomError(
        AppErrorCode.PERMISSION_DENIED,
        `Role ${ctx.role} is not authorized. Required: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  },

  /**
   * Resource Ownership: Ensure the user owns the resource or is an Admin.
   * (Placeholder logic - requires resource lookup in actual usage)
   */
  isOwnerOrAdmin: (ctx: OrgContext, resourceOwnerId: string) => {
    if (ctx.role === UserRole.ADMIN) return true;
    if (ctx.userId === resourceOwnerId) return true;

    throw new CustomError(
      AppErrorCode.PERMISSION_DENIED,
      'You do not have permission to modify this resource.',
    );
  },

  /**
   * Guard: Ensure user is fully authenticated and onboarded to an org.
   */
  isAuthenticatedAndOnboarded: (ctx: { userId: string; orgId?: string }) => {
    if (!ctx.userId) throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'User not authenticated');
    if (!ctx.orgId)
      throw new CustomError(AppErrorCode.ORGANIZATION_REQUIRED, 'No organization context found');
    return true;
  },
};
