'use server';

import { authActionClient } from '@/core/safe-action/safe-action';
import { z } from 'zod';
import { authService } from './auth.service';

/**
 * Schema for profile updates
 */
export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  photoFile: z.instanceof(File).optional().nullable(),
  removePhoto: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

/**
 * Update user profile (display name and/or photo)
 * - Automatically deletes old photo when uploading new one
 * - Supports removing photo
 * - Users can only update their own profile
 */
export const updateProfileAction = authActionClient
  .metadata({ name: 'profile.update' })
  .schema(ProfileUpdateSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await authService.updateUserProfile(ctx.userId, parsedInput);
  });
