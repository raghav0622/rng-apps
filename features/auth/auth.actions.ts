// features/auth/auth.actions.ts
'use server';

import { actionClient, authActionClient } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { CreateSessionSchema, SignupSchema } from './auth.model';
import { AuthService } from './auth.service';

export const signinAction = actionClient
  .metadata({ name: 'auth.signin' })
  .inputSchema(z.object({ email: z.email() }))
  .action(async ({ parsedInput }) => {
    return await AuthService.signin(parsedInput);
  });

export const signupAction = actionClient
  .metadata({ name: 'auth.signup' })
  .inputSchema(SignupSchema)
  .action(async ({ parsedInput }) => {
    return await AuthService.signup(parsedInput);
  });

export const createSessionAction = actionClient
  .metadata({ name: 'auth.createSession' })
  .inputSchema(CreateSessionSchema)
  .action(async ({ parsedInput }) => {
    return await AuthService.createSession(parsedInput.idToken);
  });

export const logoutAction = actionClient.metadata({ name: 'auth.logout' }).action(async () => {
  await AuthService.logout();
  redirect('/login');
});

export const revokeAllSessionsAction = authActionClient
  .metadata({ name: 'auth.revokeAllSessions' })
  .action(async ({ ctx }) => {
    await AuthService.revokeAllSessions(ctx.userId);
  });

export const getSessionsAction = authActionClient
  .metadata({ name: 'auth.getSessions' })
  .action(async ({ ctx }) => {
    return await AuthService.getActiveSessions(ctx.userId);
  });

export const revokeSessionAction = authActionClient
  .metadata({ name: 'auth.revokeSession' })
  .inputSchema(z.object({ sessionId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    return await AuthService.revokeSession(ctx.userId, parsedInput.sessionId);
  });

export const updateUserAction = authActionClient
  .metadata({ name: 'auth.updateUser' })
  .inputSchema(
    z.object({
      displayName: z.string().min(2),
      photoUrl: z.string().optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    // Update Auth + DB
    await AuthService.updateUserProfile(ctx.userId, parsedInput);

    // We do NOT refresh the session cookie here because Firebase Session Cookies are immutable.
    // Instead, we revalidate the layout so the Server Components fetch the fresh User from DB.
    revalidatePath('/', 'layout');

    return { success: true, data: undefined };
  });

export const deleteAccountAction = authActionClient
  .metadata({ name: 'auth.deleteAccount' })
  .action(async ({ ctx }) => {
    return await AuthService.deleteUserAccount(ctx.userId);
  });
