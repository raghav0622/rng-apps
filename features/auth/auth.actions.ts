'use server';

import { actionClient, authActionClient } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { CreateSessionSchema, SignupSchema } from './auth.model';

// CHANGE: Import specific domain services
import { auth } from '@/lib/firebase/admin';
import { AuthService } from './services/auth.service';
import { SessionService } from './services/session.service';
import { UserService } from './services/user.service';

// --- AUTHENTICATION (Login/Signup) ---

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

// --- SESSION MANAGEMENT ---

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

// --- USER PROFILE ---

export const updateUserAction = authActionClient
  .metadata({ name: 'auth.updateUser' })
  .inputSchema(
    z.object({
      displayName: z.string().min(2),
      photoUrl: z.string().optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    await UserService.updateUserProfile(ctx.userId, parsedInput);
    revalidatePath('/', 'layout');
    return { success: true, data: undefined };
  });

export const deleteAccountAction = authActionClient
  .metadata({ name: 'auth.deleteAccount' })
  .action(async ({ ctx }) => {
    return await UserService.deleteUserAccount(ctx.userId);
  });

// --- ACCOUNT SECURITY & VERIFICATION ---

export const checkVerificationStatusAction = authActionClient
  .metadata({ name: 'auth.checkVerificationStatus' })
  .action(async ({ ctx }) => {
    return await UserService.refreshEmailVerificationStatus(ctx.userId);
  });

export const verifyEmailSyncAction = authActionClient
  .metadata({ name: 'auth.verifyEmailSync' })
  .action(async ({ ctx }) => {
    return await UserService.refreshEmailVerificationStatus(ctx.userId);
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
    // Password changes are Credential operations, so they stay in AuthService
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

export const syncUserAction = authActionClient
  .metadata({ name: 'auth.syncUser' })
  .action(async ({ ctx }) => {
    // The 'authActionClient' middleware already guarantees 'ctx.userId' is valid via Cookie.
    try {
      // Generate a fresh Custom Token for the client SDK
      const customToken = await auth().createCustomToken(ctx.userId);
      return { success: true, data: customToken };
    } catch (error) {
      console.error('Sync Token Generation Failed:', error);
      // Fail silently to avoid UI disruption, but client SDK will remain signed out
      return { success: false, error: 'Failed to sync session' };
    }
  });
