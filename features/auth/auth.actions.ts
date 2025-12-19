// features/auth/auth.actions.ts
'use server';

import { actionClient, authActionClient } from '@/lib/safe-action';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authRepository } from './auth.repository';
import { AuthService } from './auth.service';

const SessionSchema = z.object({
  idToken: z.string(),
  fullName: z.string().optional(),
});

export const createSessionAction = actionClient
  .metadata({ name: 'auth.createSession' })
  .schema(SessionSchema)
  .action(async ({ parsedInput: { idToken, fullName } }) => {
    return await AuthService.createSession(idToken, fullName);
  });

export const logoutAction = actionClient.metadata({ name: 'auth.logout' }).action(async () => {
  await AuthService.logout();
  redirect('/login');
});

// FIX: Schema must allow null for photoURL to support removal
const UpdateProfileSchema = z.object({
  displayName: z.string().min(2),
  photoURL: z.string().nullable().optional(),
});

export const updateProfileAction = authActionClient
  .metadata({ name: 'auth.updateProfile' })
  .schema(UpdateProfileSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await AuthService.updateProfile(ctx.userId, parsedInput);
  });

export const deleteAccountAction = authActionClient
  .metadata({ name: 'auth.deleteAccount' })
  .action(async ({ ctx }) => {
    // FIX: Do not redirect here. Return the result so the client can handle navigation.
    // Redirecting here throws an error ('NEXT_REDIRECT') which is caught by the
    // ConfirmPasswordModal as a "failure" (incorrect password).
    return await AuthService.deleteAccount(ctx.userId);
  });

export const getProfileAction = authActionClient
  .metadata({ name: 'auth.getProfile' })
  .action(async ({ ctx }) => {
    return await authRepository.getUser(ctx.userId);
  });
