// lib/action-policies.ts
import { OrgContext, TracingContext } from './types';
import { CustomError, AppErrorCode } from './errors';
import { UserRole } from './enums'; // FIX: Import from shared enums

// Re-export for compatibility with other files
export { UserRole };

export type Permission = 'team:view' | 'team:manage' | 'billing:manage' | 'org:manage';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: ['team:manage', 'team:view', 'billing:manage', 'org:manage'],
  [UserRole.ADMIN]: ['team:manage', 'team:view'],
  [UserRole.MEMBER]: ['team:view'],
  [UserRole.SYSTEM_USER]: [],
};

export const withPermissions = (requiredPermission: Permission) => {
  return async (context: OrgContext & TracingContext) => {
    const userRole = context.role as UserRole;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (!permissions.includes(requiredPermission)) {
      throw new CustomError(
        AppErrorCode.FORBIDDEN,
        `Permission denied. Role ${userRole} cannot perform ${requiredPermission}.`,
        { userId: context.userId, orgId: context.orgId },
      );
    }
  };
};

export const withFeature = (featureName: string) => {
  return async (context: OrgContext & TracingContext) => {
    if (!context.orgId) {
      throw new CustomError(
        AppErrorCode.ORGANIZATION_REQUIRED,
        'Organization required for feature check.',
      );
    }

    // TODO: Implement actual feature flag lookup based on orgId
    // For now, this is a placeholder.
    // In a real application, you would query a database or a feature flag service
    // to check if the 'featureName' is enabled for 'context.orgId'.
    const isFeatureEnabled = true; // Placeholder: Assume feature is always enabled for now

    if (!isFeatureEnabled) {
      throw new CustomError(
        AppErrorCode.FEATURE_DISABLED,
        `Feature "${featureName}" is disabled for organization "${context.orgId}".`, // FIX: Typo in 'withFeatuer'
        { featureName, orgId: context.orgId },
      );
    }
  };
};
