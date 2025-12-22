'use server';

import { CreateSessionSchema, SignupSchema } from '@/features/auth/auth.model';
import { AuthService } from '@/features/auth/services/auth.service';
import { SessionService } from '@/features/auth/services/session.service';
import { auth } from '@/lib/firebase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { actionClient, authActionClient } from '@/lib/safe-action';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// REMOVED: signinAction (Insecure: allowed logging in with just an email)

export const signupAction = actionClient
  .metadata({ name: 'auth.signup' })
  .inputSchema(SignupSchema)
  .action(async ({ parsedInput }) => {
    // 🛡️ Security: Prevent brute-force account creation
    await checkRateLimit();
    return await AuthService.signup(parsedInput);
  });

export const createSessionAction = actionClient
  .metadata({ name: 'auth.createSession' })
  .inputSchema(CreateSessionSchema)
  .action(async ({ parsedInput }) => {
    // Note: Rate limiting here is less critical as it requires a valid ID token first,
    // but good for depth defense against token replay attacks.
    await checkRateLimit();
    return await SessionService.createSession(parsedInput.idToken);
  });

export const logoutAction = actionClient.metadata({ name: 'auth.logout' }).action(async () => {
  await SessionService.logout();
  redirect('/login');
});

export const revokeAllSessionsAction = authActionClient
  .metadata({ name: 'auth.revokeAllSessions' })
  .action(async ({ ctx }) => {
    await SessionService.revokeAllSessions(ctx.userId);
  });

export const getSessionsAction = authActionClient
  .metadata({ name: 'auth.getSessions' })
  .action(async ({ ctx }) => {
    return await SessionService.getActiveSessions(ctx.userId);
  });

export const revokeSessionAction = authActionClient
  .metadata({ name: 'auth.revokeSession' })
  .inputSchema(z.object({ sessionId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    return await SessionService.revokeSession(ctx.userId, parsedInput.sessionId);
  });

export const syncUserAction = authActionClient
  .metadata({ name: 'auth.syncUser' })
  .action(async ({ ctx }) => {
    try {
      const customToken = await auth().createCustomToken(ctx.userId);
      return { success: true, data: customToken };
    } catch (error) {
      console.error('Sync Token Generation Failed:', error);
      return { success: false, error: 'Failed to sync session' };
    }
  });
