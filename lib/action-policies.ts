import { UserRoleInOrg } from '@/features/enums';

export enum AppPermission {
  // Organization Management
  ORG_UPDATE = 'ORG_UPDATE',
  ORG_DELETE = 'ORG_DELETE',
  ORG_VIEW_SETTINGS = 'ORG_VIEW_SETTINGS',

  // Member Management
  MEMBER_INVITE = 'MEMBER_INVITE',
  MEMBER_UPDATE = 'MEMBER_UPDATE',
  MEMBER_REMOVE = 'MEMBER_REMOVE',
  MEMBER_VIEW = 'MEMBER_VIEW',

  // Billing & Subscription
  BILLING_MANAGE = 'BILLING_MANAGE',
  BILLING_VIEW = 'BILLING_VIEW',

  // Feature Flags / Advanced
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  MANAGE_API_KEYS = 'MANAGE_API_KEYS',

  // Basic Access
  APP_ACCESS = 'APP_ACCESS',
}

/**
 * Mapping of Roles to their implicit permissions.
 * This adheres to the Principle of Least Privilege.
 */
export const ROLE_PERMISSIONS: Record<UserRoleInOrg, AppPermission[]> = {
  [UserRoleInOrg.OWNER]: [
    AppPermission.ORG_UPDATE,
    AppPermission.ORG_DELETE,
    AppPermission.ORG_VIEW_SETTINGS,
    AppPermission.MEMBER_INVITE,
    AppPermission.MEMBER_UPDATE,
    AppPermission.MEMBER_REMOVE,
    AppPermission.MEMBER_VIEW,
    AppPermission.BILLING_MANAGE,
    AppPermission.BILLING_VIEW,
    AppPermission.VIEW_AUDIT_LOGS,
    AppPermission.MANAGE_API_KEYS,
    AppPermission.APP_ACCESS,
  ],
  [UserRoleInOrg.ADMIN]: [
    AppPermission.ORG_UPDATE,
    AppPermission.ORG_VIEW_SETTINGS,
    AppPermission.MEMBER_INVITE,
    AppPermission.MEMBER_UPDATE,
    AppPermission.MEMBER_REMOVE,
    AppPermission.MEMBER_VIEW,
    AppPermission.BILLING_VIEW,
    AppPermission.VIEW_AUDIT_LOGS,
    AppPermission.APP_ACCESS,
  ],
  [UserRoleInOrg.MEMBER]: [AppPermission.MEMBER_VIEW, AppPermission.APP_ACCESS],
  [UserRoleInOrg.NOT_IN_ORG]: [
    // Users who are authenticated but not in an org yet (onboarding flow)
  ],
};

/**
 * Checks if a specific role possesses a required permission.
 */
export function hasPermission(role: UserRoleInOrg, required: AppPermission): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(required);
}

/**
 * Checks if a role has ALL listed permissions.
 */
export function hasAllPermissions(role: UserRoleInOrg, required: AppPermission[]): boolean {
  if (!required || required.length === 0) return true;
  return required.every((p) => hasPermission(role, p));
}
