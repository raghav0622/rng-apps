'use server';

import { checkRateLimit } from '@/lib/rate-limit';
import { authActionClient } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { UserService } from '../services/user.service';

export const updateUserAction = authActionClient
  .metadata({ name: 'auth.updateUser' })
  .inputSchema(
    z.object({
      displayName: z.string().min(2),
      photoUrl: z.string().optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    await checkRateLimit();
    await UserService.updateUserProfile(ctx.userId, parsedInput);
    revalidatePath('/', 'layout');
    return { success: true, data: undefined };
  });

export const deleteAccountAction = authActionClient
  .metadata({ name: 'auth.deleteAccount' })
  .action(async ({ ctx }) => {
    await checkRateLimit();
    return await UserService.deleteUserAccount(ctx.userId);
  });
