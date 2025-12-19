import { BaseEntity } from '@/lib/types';
import { z } from 'zod';

export interface Organization extends BaseEntity {
  name: string;
  ownerId: string;
}

// Input for creating an org
export const CreateOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
});

// Input for updating an org
export const UpdateOrgSchema = z.object({
  orgId: z.string(),
  name: z.string().min(2).optional(),
});

export type CreateOrgInput = z.infer<typeof CreateOrgSchema>;
export type UpdateOrgInput = z.infer<typeof UpdateOrgSchema>;
