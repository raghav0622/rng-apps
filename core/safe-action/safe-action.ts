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

export const actionClient = createSafeActionClient({
  handleServerError: (e, utils) => {
    const traceId = getTraceId();

    // 1. Log the full error to the SERVER console (Check your terminal!)
    console.error('\n🚨 [SERVER ACTION ERROR] 🚨');
    console.error('Action:', utils.metadata?.name);
    console.error('Input:', utils.clientInput);
    console.error('Error:', e);
    console.error('Stack:', (e as Error).stack);
    console.error('----------------------------\n');

    logError('Action Error', {
      traceId,
      error: e,
      action: utils.metadata?.name,
      clientInput: utils.clientInput,
    });

    if (e instanceof CustomError) {
      return e.toAppError(traceId);
    }

    // 2. UNMASK THE ERROR (Send actual message to UI)
    return {
      code: AppErrorCode.INTERNAL_ERROR,
      message: (e as Error).message || DEFAULT_SERVER_ERROR_MESSAGE, // <--- REVEAL ERROR
      traceId,
      details: {},
    } as AppError;
  },
  defineMetadataSchema: () =>
    z.object({
      name: z.string(),
      permissions: z.array(z.nativeEnum(AppPermission)).optional(),
    }),
});

// ... (Rest of the file: authActionClient, orgActionClient remain the same)
export const authActionClient = actionClient
  .use(async ({ next }) => {
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
      const decodedToken = await auth().verifySessionCookie(sessionToken, true);
      const isValidSession = await SessionService.validateSession(decodedToken.uid, sessionId);
      if (!isValidSession) {
        throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session has been revoked.');
      }

      const user = await userRepository.getUserIncludeDeleted(decodedToken.uid);
      if (!user) {
        throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'User account not found.');
      }
      if (user.deletedAt) {
        throw new CustomError(AppErrorCode.ACCOUNT_DISABLED, 'This account has been disabled.');
      }

      const orgId = user.orgId;
      const orgRole = user.orgRole || UserRoleInOrg.NOT_IN_ORG;

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
          user,
        },
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session expired or invalid.');
    }
  });

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
      orgId: ctx.orgId,
      role: ctx.orgRole,
    },
  });
});
