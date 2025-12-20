// features/auth/auth.actions.ts
'use server';

import { actionClient, authActionClient } from '@/lib/safe-action';
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
    // Optionally redirect to login or show success message
    // If you redirect, the current user will be logged out immediately
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
