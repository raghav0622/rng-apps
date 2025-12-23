import { userRepository } from '@/features/auth/repositories/user.repository';
import { createSafeActionClient } from 'next-safe-action';
import { cookies } from 'next/headers';
import 'server-only';
import { z } from 'zod';
import { AUTH_SESSION_COOKIE_NAME } from './constants';
import { AppError, AppErrorCode, CustomError } from './errors';
import { auth } from './firebase/admin';
import { logError } from './logger';
import { getTraceId } from './tracing';

export const actionClient = createSafeActionClient({
  handleServerError: (e, utils) => {
    const traceId = getTraceId();
    // Log the error for debugging
    logError('Action Error', { traceId, error: e, action: utils.metadata?.name });

    // Pass through CustomErrors (like "Invalid session") to the client
    if (e instanceof CustomError) {
      return e.toAppError(traceId);
    }

    return {
      code: AppErrorCode.UNKNOWN,
      message: 'Something went wrong. Please try again.',
      traceId,
      details: {},
    } as AppError;
  },
  defineMetadataSchema: () => z.object({ name: z.string() }),
});

export const authActionClient = actionClient.use(async ({ next, ctx }) => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session missing. Please log in.');
  }

  try {
    // 1. Verify Cookie Signature & Expiration
    const decodedToken = await auth().verifySessionCookie(sessionToken, true);

    // 2. Database Integrity Check (Prevents Banned/Deleted users from acting)
    // We check this on every action to ensure immediate lockout
    const user = await userRepository.getUserIncludeDeleted(decodedToken.uid);

    if (!user) {
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'User account not found.');
    }

    if (user.deletedAt) {
      throw new CustomError(AppErrorCode.ACCOUNT_DISABLED, 'This account has been disabled.');
    }

    return next({
      ctx: {
        ...ctx,
        userId: decodedToken.uid,
        email: decodedToken.email, // Only immutable data from token
      },
    });
  } catch (error) {
    // Specifically catch revocation/expiration to give a clear error
    throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session expired or invalid.');
  }
});

// ----------------------------------------------------------------------------
// // 3. Organization Middleware (Enforce Single Tenancy)
// // ----------------------------------------------------------------------------

// export const orgActionClient = authActionClient.use(async ({ next, ctx }) => {
//   const cookieStore = await cookies();
//   const { orgId } = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value as UserInSession;

//   if (!orgId) {
//     throw new CustomError(AppErrorCode.ORGANIZATION_REQUIRED, 'No active organization selected');
//   }

//   // Verify user's membership in this org
//   // We check the 'members' collection in the org document or a dedicated 'memberships' collection.
//   // Assuming a subcollection structure: organizations/{orgId}/members/{userId}
//   const memberSnap = await firestore()
//     .collection('organizations')
//     .doc(orgId)
//     .collection('members')
//     .doc(ctx.userId)
//     .get();

//   if (!memberSnap.exists) {
//     throw new CustomError(
//       AppErrorCode.ORG_ACCESS_DENIED,
//       'User is not a member of this organization',
//     );
//   }

//   const memberData = memberSnap.data();
//   const role = memberData?.role as UserRoleInOrg;

//   return next({
//     ctx: {
//       ...ctx,
//       orgId,
//       role,
//     },
//   });
// });

// // ----------------------------------------------------------------------------
// // 4. Permissions Utility (To be used inside actions)
// // ----------------------------------------------------------------------------
// /**
//  * Utility to enforce permissions dynamically inside the action handler
//  * if strict middleware isn't enough (e.g., conditional permissions).
//  */
// export function requirePermission(role: UserRoleInOrg, requiredRole: UserRoleInOrg[]) {
//   if (!requiredRole.includes(role)) {
//     throw new CustomError(
//       AppErrorCode.PERMISSION_DENIED,
//       `Role ${role} lacks required permissions.`,
//     );
//   }
// }
