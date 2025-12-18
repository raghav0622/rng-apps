'use server';

import { actionClient } from '@/lib/safe-action';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { AuthService } from './auth.service';

// Schema updated to include fullName
const SessionSchema = z.object({
  idToken: z.string(),
  fullName: z.string().optional(),
});

export const createSessionAction = actionClient
  .metadata({ name: 'auth.createSession' })
  .schema(SessionSchema)
  .action(async ({ parsedInput: { idToken, fullName } }) => {
    // Pass fullName to the service
    return await AuthService.createSession(idToken, fullName);
  });

export const logoutAction = actionClient.metadata({ name: 'auth.logout' }).action(async () => {
  await AuthService.logout();
  redirect('/login');
});
