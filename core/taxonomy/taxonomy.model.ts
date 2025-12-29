import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

export const TaxonomySchema = z.object({
  id: z.string(),
  orgId: z.string(),

  scope: z.string(),
  label: z.string().min(1),
  value: z.string().min(1),

  // REMOVED: color field

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type TaxonomyItem = z.infer<typeof TaxonomySchema> & BaseEntity;
