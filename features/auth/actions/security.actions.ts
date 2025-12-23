'use server';

import { checkRateLimit } from '@/lib/rate-limit';
import { actionClient, authActionClient } from '@/lib/safe-action';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

export const checkVerificationStatusAction = authActionClient
  .metadata({ name: 'auth.checkVerificationStatus' })
  .action(async ({ ctx }) => {
    await checkRateLimit();
    return await UserService.refreshEmailVerificationStatus(ctx.userId);
  });

export const verifyEmailSyncAction = authActionClient
  .metadata({ name: 'auth.verifyEmailSync' })
  .action(async ({ ctx }) => {
    await checkRateLimit();
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
    await checkRateLimit();
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
    await checkRateLimit();
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
    await checkRateLimit();
    return await AuthService.confirmPasswordReset(parsedInput.oobCode, parsedInput.newPassword);
  });
