'use server';

import { CreateSessionSchema, SignupSchema } from '@/features/auth/auth.model';
import { AuthService } from '@/features/auth/services/auth.service';
import { SessionService } from '@/features/auth/services/session.service';
import { checkRateLimit } from '@/lib/rate-limit';
import { actionClient, authActionClient } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export const signupAction = actionClient
  .metadata({ name: 'auth.signup' })
  .inputSchema(SignupSchema)
  .action(async ({ parsedInput }) => {
    // 🛡️ Security: High Risk Action
    await checkRateLimit();
    return await AuthService.signup(parsedInput);
  });

export const createSessionAction = actionClient
  .metadata({ name: 'auth.createSession' })
  .inputSchema(CreateSessionSchema)
  .action(async ({ parsedInput }) => {
    // 🛡️ Security: Protects against token replay spam
    await checkRateLimit();
    return await SessionService.createSession(parsedInput.idToken);
  });

export const logoutAction = actionClient.metadata({ name: 'auth.logout' }).action(async () => {
  await SessionService.logout();
  redirect('/login');
});

export const getSessionsAction = authActionClient
  .metadata({ name: 'session.getAll' })
  .action(async ({ ctx }) => {
    return await SessionService.getActiveSessions(ctx.userId);
  });

export const revokeSessionAction = authActionClient
  .metadata({ name: 'session.revoke' })
  .inputSchema(z.object({ sessionId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    await SessionService.revokeSession(ctx.userId, parsedInput.sessionId);
    revalidatePath('/profile');
    return { success: true, data: undefined };
  });

export const revokeAllSessionsAction = authActionClient
  .metadata({ name: 'session.revokeAll' })
  .action(async ({ ctx }) => {
    await checkRateLimit();
    await SessionService.revokeAllSessions(ctx.userId);
    return { success: true, data: undefined };
  });

export const syncUserAction = authActionClient
  .metadata({ name: 'auth.syncUser' })
  .action(async ({ ctx }) => {
    await checkRateLimit();
    try {
      // Lazy load admin to avoid circular deps if any
      const customToken = await import('@/lib/firebase/admin').then((m) =>
        m.auth().createCustomToken(ctx.userId),
      );
      return { success: true, data: customToken };
    } catch (error) {
      console.error('Sync Token Generation Failed:', error);
      return { success: false, error: 'Failed to sync session' };
    }
  });
