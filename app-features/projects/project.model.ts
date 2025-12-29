import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

export enum ProjectPhase {
  PROPOSAL = 'PROPOSAL',
  PRE_DESIGN = 'PRE_DESIGN',
  SCHEMATIC_DESIGN = 'SCHEMATIC_DESIGN',
  DESIGN_DEVELOPMENT = 'DESIGN_DEVELOPMENT',
  CONSTRUCTION_DOCS = 'CONSTRUCTION_DOCS',
  BIDDING = 'BIDDING',
  ADMINISTRATION = 'ADMINISTRATION',
  CLOSEOUT = 'CLOSEOUT',
  ARCHIVED = 'ARCHIVED',
}

export enum FeeStructure {
  FIXED_FEE = 'FIXED_FEE',
  HOURLY = 'HOURLY',
  PERCENTAGE_CONSTRUCTION = 'PERCENTAGE_CONSTRUCTION',
}

export const ProjectSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  code: z.string().min(2),
  name: z.string().min(2),
  clientId: z.string(),

  siteAddress: z.string().optional(),
  siteCoordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),

  phase: z.nativeEnum(ProjectPhase).default(ProjectPhase.PROPOSAL),
  startDate: z.date().optional(),
  targetCompletionDate: z.date().optional(),

  feeStructure: z.nativeEnum(FeeStructure).default(FeeStructure.HOURLY),
  totalBudget: z.number().optional(),
  designFee: z.number().optional(),
  retainerPaid: z.boolean().default(false),
  currency: z.string().default('USD'),

  managerId: z.string().optional(),
  teamIds: z.array(z.string()).default([]),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Project = z.infer<typeof ProjectSchema> & BaseEntity;
