'use server';

import { auth } from '@/lib/firebase/admin';
import { actionClient, authActionClient } from '@/lib/safe-action';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { CreateSessionSchema, SignupSchema } from '../auth.model';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

export const signinAction = actionClient
  .metadata({ name: 'auth.signin' })
  .inputSchema(z.object({ email: z.email() }))
  .action(async ({ parsedInput }) => {
    // TODO: Add Rate Limiting here
    return await AuthService.signin(parsedInput);
  });

export const signupAction = actionClient
  .metadata({ name: 'auth.signup' })
  .inputSchema(SignupSchema)
  .action(async ({ parsedInput }) => {
    // TODO: Add Rate Limiting here
    return await AuthService.signup(parsedInput);
  });

export const createSessionAction = actionClient
  .metadata({ name: 'auth.createSession' })
  .inputSchema(CreateSessionSchema)
  .action(async ({ parsedInput }) => {
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
