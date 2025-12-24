import 'server-only';

import { AppPermission, hasAllPermissions, UserRoleInOrg } from '@/lib/action-policies';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { logError } from '@/lib/logger';
import { AppError, AppErrorCode, CustomError } from '@/lib/utils/errors';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getTraceId } from '@/lib/utils/tracing';
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { userRepository } from '../../core/auth/repositories/user.repository';
import { SessionService } from '../../core/auth/services/session.service';

// ----------------------------------------------------------------------------
// 1. Base Action Client (Public / Infrastructure)
// ----------------------------------------------------------------------------

/**
 * The base client for type-safe server actions.
 * Handles top-level error catching, logging, and metadata schema definitions.
 *
 * @example
 * // Define a public action
 * export const myAction = actionClient
 * .schema(mySchema)
 * .action(async ({ parsedInput }) => { ... });
 */
export const actionClient = createSafeActionClient({
  handleServerError: (e, utils) => {
    const traceId = getTraceId();
    // Log with high fidelity including the action name and inputs if needed
    logError('Action Error', {
      traceId,
      error: e,
      action: utils.metadata?.name,
      clientInput: utils.clientInput,
    });

    // Pass through known AppErrors
    if (e instanceof CustomError) {
      return e.toAppError(traceId);
    }

    // Obfuscate unknown errors
    return {
      code: AppErrorCode.UNKNOWN,
      message: DEFAULT_SERVER_ERROR_MESSAGE,
      traceId,
      details: {},
    } as AppError;
  },
  // Define metadata schema to include name and required RBAC permissions
  defineMetadataSchema: () =>
    z.object({
      name: z.string(),
      permissions: z.array(z.nativeEnum(AppPermission)).optional(),
    }),
});

// ----------------------------------------------------------------------------
// 2. Authenticated Middleware (Session & User Context)
// ----------------------------------------------------------------------------

/**
 * An authenticated action client.
 * Enforces:
 * 1. Rate Limiting.
 * 2. Session validity (Cookie & Redis check).
 * 3. User existence and "not disabled" check.
 * 4. RBAC permissions (if defined in metadata).
 *
 * It injects `ctx.user`, `ctx.userId`, `ctx.orgId`, etc., into the action context.
 *
 * @example
 * export const updateProfile = authActionClient
 * .metadata({ name: 'update-profile' })
 * .schema(updateSchema)
 * .action(async ({ ctx, parsedInput }) => {
 * console.log(ctx.userId); // Safe to use
 * });
 */
export const authActionClient = actionClient
  .use(async ({ next }) => {
    // A. Rate Limiting Strategy (Token Bucket via Redis usually)
    await checkRateLimit();
    return next();
  })
  .use(async ({ next, ctx, metadata }) => {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
    const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

    if (!sessionToken || !sessionId) {
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session missing. Please log in.');
    }

    try {
      // B. Verify Firebase Token
      const decodedToken = await auth().verifySessionCookie(sessionToken, true);

      // C. Strict Session Check (Revocation Check)
      const isValidSession = await SessionService.validateSession(decodedToken.uid, sessionId);
      if (!isValidSession) {
        throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session has been revoked.');
      }

      // D. User Context & Existence Check
      const user = await userRepository.getUserIncludeDeleted(decodedToken.uid);
      if (!user) {
        throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'User account not found.');
      }
      if (user.deletedAt) {
        throw new CustomError(AppErrorCode.ACCOUNT_DISABLED, 'This account has been disabled.');
      }

      // E. Resolve Org Context (Single Tenancy)
      // We explicitly attach orgId and role from the User entity.
      // This enforces that the user carries their org context with them.
      const orgId = user.orgId; // string | undefined
      const orgRole = user.orgRole || UserRoleInOrg.NOT_IN_ORG;

      // F. RBAC Permission Check
      // If the action metadata requires specific permissions, we check them here.
      if (metadata.permissions && metadata.permissions.length > 0) {
        if (!hasAllPermissions(orgRole, metadata.permissions)) {
          throw new CustomError(
            AppErrorCode.PERMISSION_DENIED,
            `Role ${orgRole} lacks required permissions: ${metadata.permissions.join(', ')}`,
          );
        }
      }

      return next({
        ctx: {
          ...ctx,
          userId: decodedToken.uid,
          email: decodedToken.email,
          sessionId,
          orgId,
          orgRole,
          user, // Full user object for advanced logic if needed
        },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      // Handle Firebase specific errors
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session expired or invalid.');
    }
  });

// ----------------------------------------------------------------------------
// 3. Organization Middleware (Strict Tenancy Enforcer)
// ----------------------------------------------------------------------------
/**
 * Use this client for ANY action that reads/writes organization data.
 * It guarantees that `ctx.orgId` is present and valid.
 *
 * @throws {ORGANIZATION_REQUIRED} If the user is not currently in an organization.
 *
 * @example
 * export const createProject = orgActionClient
 * .metadata({ name: 'create-project', permissions: [AppPermission.PROJECT_CREATE] })
 * .schema(projectSchema)
 * .action(async ({ ctx }) => {
 * // ctx.orgId is guaranteed to be a string here
 * await db.create(ctx.orgId, ...);
 * });
 */
export const orgActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (!ctx.orgId || ctx.orgRole === UserRoleInOrg.NOT_IN_ORG) {
    throw new CustomError(
      AppErrorCode.ORGANIZATION_REQUIRED,
      'This action requires an active organization context.',
    );
  }

  return next({
    ctx: {
      ...ctx,
      orgId: ctx.orgId, // Narrowed type: string (not undefined)
      role: ctx.orgRole,
    },
  });
});
