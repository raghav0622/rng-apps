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

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2),
  photoURL: z.string().optional(),
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
    await AuthService.deleteAccount(ctx.userId);
    redirect('/login');
  });

export const getProfileAction = authActionClient
  .metadata({ name: 'auth.getProfile' })
  .action(async ({ ctx }) => {
    return await authRepository.getUser(ctx.userId);
  });
