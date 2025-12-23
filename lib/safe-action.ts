import { userRepository } from '@/features/auth/repositories/user.repository';
import { SessionService } from '@/features/auth/services/session.service';
import { createSafeActionClient } from 'next-safe-action';
import { cookies } from 'next/headers';
import 'server-only';
import { z } from 'zod';
import { AUTH_SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from './constants';
import { AppError, AppErrorCode, CustomError } from './errors';
import { auth } from './firebase/admin';
import { logError } from './logger';
import { getTraceId } from './tracing';

export const actionClient = createSafeActionClient({
  handleServerError: (e, utils) => {
    const traceId = getTraceId();
    logError('Action Error', { traceId, error: e, action: utils.metadata?.name });

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
  const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;

  if (!sessionToken || !sessionId) {
    throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session missing. Please log in.');
  }

  try {
    // 1. Verify Cookie Signature
    const decodedToken = await auth().verifySessionCookie(sessionToken, true);

    // 2. Validate Session & Get Cached User
    // Optimization: Returns cached user to avoid DB hit
    const { isValid, cachedUser } = await SessionService.validateSession(
      decodedToken.uid,
      sessionId,
    );

    if (!isValid) {
      throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session has been revoked.');
    }

    // 3. Resolve User (Cache -> DB Fallback)
    let user = cachedUser;

    // If cache missed (e.g. redis restart), fetch from DB
    if (!user) {
      const dbUser = await userRepository.getUserIncludeDeleted(decodedToken.uid);
      if (!dbUser) {
        throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'User account not found.');
      }
      user = dbUser;
    }

    // 4. Check Account Status
    if (user.deletedAt) {
      throw new CustomError(AppErrorCode.ACCOUNT_DISABLED, 'This account has been disabled.');
    }

    return next({
      ctx: {
        ...ctx,
        userId: decodedToken.uid,
        email: decodedToken.email || user.email,
        sessionId: sessionId,
        // Pass basic role info if needed for permissions
        orgId: user.orgId,
        orgRole: user.orgRole,
      },
    });
  } catch (error) {
    // If known error, throw as is
    if (error instanceof CustomError) throw error;

    console.error('Auth Middleware Error:', error);
    throw new CustomError(AppErrorCode.UNAUTHENTICATED, 'Session expired or invalid.');
  }
});
