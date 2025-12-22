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
      // Allow empty string to signify "Delete Avatar"
      photoUrl: z.string().optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    await AuthService.updateUserProfile(ctx.userId, parsedInput);

    // Critical: Revalidate layout to update avatars in header/sidebar
    revalidatePath('/', 'layout');

    return { success: true, data: undefined };
  });

export const deleteAccountAction = authActionClient
  .metadata({ name: 'auth.deleteAccount' })
  .action(async ({ ctx }) => {
    return await AuthService.deleteUserAccount(ctx.userId);
  });

/**
 * Manually checks if the user is verified in Firebase Auth and syncs it to Firestore.
 * Useful when verification happens on a different device.
 */
export const checkVerificationStatusAction = authActionClient
  .metadata({ name: 'auth.checkVerificationStatus' })
  .action(async ({ ctx }) => {
    return await AuthService.refreshEmailVerificationStatus(ctx.userId);
  });

export const verifyEmailSyncAction = authActionClient
  .metadata({ name: 'auth.verifyEmailSync' })
  .action(async ({ ctx }) => {
    return await AuthService.refreshEmailVerificationStatus(ctx.userId);
  });

export const changePasswordAction = authActionClient
  .metadata({ name: 'auth.changePassword' })
  .inputSchema(
    z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    return await AuthService.changePassword(
      ctx.userId,
      ctx.email || '',
      parsedInput.currentPassword,
      parsedInput.newPassword,
    );
  });

export const verifyEmailAction = actionClient
  .metadata({ name: 'auth.verifyEmail' })
  .inputSchema(z.object({ oobCode: z.string() }))
  .action(async ({ parsedInput }) => {
    return await AuthService.verifyEmail(parsedInput.oobCode);
  });

export const confirmPasswordResetAction = actionClient
  .metadata({ name: 'auth.confirmPasswordReset' })
  .inputSchema(
    z.object({
      oobCode: z.string(),
      newPassword: z.string().min(6),
    }),
  )
  .action(async ({ parsedInput }) => {
    return await AuthService.confirmPasswordReset(parsedInput.oobCode, parsedInput.newPassword);
  });
