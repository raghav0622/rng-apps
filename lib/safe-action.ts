import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { cookies } from 'next/headers';
import 'server-only';
import { z } from 'zod';
import { AUTH_SESSION_COOKIE_NAME } from './constants';
import { AppError, AppErrorCode, CustomError } from './errors';
import { auth } from './firebase/admin';
import { logError, logInfo } from './logger';
import { generateTraceId, getTraceId, withTraceId } from './tracing';

// ----------------------------------------------------------------------------
// 1. Base Client & Error Handling
// ----------------------------------------------------------------------------

export const actionClient = createSafeActionClient({
  handleServerError: (e, utils) => {
    const traceId = getTraceId();
    const { clientInput, metadata } = utils;

    // Log the raw error on the server
    logError('Action Failed', {
      traceId,
      error: e,
      input: clientInput,
      action: metadata?.name,
    });

    // If it's a known CustomError, return it safely
    if (e instanceof CustomError) {
      return e.toAppError(traceId);
    }

    // Otherwise return a generic unknown error
    return {
      code: AppErrorCode.UNKNOWN,
      message: DEFAULT_SERVER_ERROR_MESSAGE,
      traceId,
      details: {},
    } as AppError;
  },
  // Inject Trace ID into the metadata for every action execution
  defineMetadataSchema: () =>
    z.object({
      name: z.string(),
    }),
}).use(async ({ next, metadata }) => {
  // Global Tracing Middleware
  const traceId = generateTraceId();

  return withTraceId(traceId, async () => {
    const start = Date.now();
    logInfo(`Action Started: ${metadata.name}`, { traceId });

    try {
      const result = await next({ ctx: { traceId } });
      const duration = Date.now() - start;
      logInfo(`Action Completed: ${metadata.name}`, { traceId, duration: `${duration}ms` });
      return result;
    } catch (e) {
      const duration = Date.now() - start;
      logError(`Action Crashed: ${metadata.name}`, { traceId, duration: `${duration}ms` });
      throw e;
    }
  });
});

// ----------------------------------------------------------------------------
// 2. Authentication Middleware
// ----------------------------------------------------------------------------

export const authActionClient = actionClient.use(async ({ next, ctx }) => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'No session found');
  }

  try {
    const decodedToken = await auth().verifySessionCookie(sessionToken, true);
    return next({
      ctx: {
        ...ctx,
        userId: decodedToken.uid,
        email: decodedToken.email,
      },
    });
  } catch (error) {
    throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Invalid session');
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
