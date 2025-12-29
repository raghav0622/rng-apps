import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

export enum ResearchStatus {
  NEW = 'NEW',
  VETTING = 'VETTING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const ResearchItemSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string().min(2),
  notes: z.string().optional(),
  vendorId: z.string().optional(),
  externalUrls: z.array(z.string().url()).default([]),
  status: z.nativeEnum(ResearchStatus).default(ResearchStatus.NEW),
  rating: z.number().min(0).max(5).optional(),

  // 🚀 IMPROVEMENT: Critical Path
  logistics: z
    .object({
      leadTimeWeeks: z.number().optional(),
      minOrderQuantity: z.string().optional(),
      originCountry: z.string().optional(),
    })
    .optional(),

  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
      }),
    )
    .default([]),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type ResearchItem = z.infer<typeof ResearchItemSchema> & BaseEntity;
