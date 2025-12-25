import { UserRoleInOrg } from '@/lib/action-policies';
import { BaseEntity } from '@/lib/firestore-repository/types';
import { z } from 'zod';

// --- Entities ---

/**
 * 🔒 User Entity
 * Represents a global user in the system.
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),

  // Tenancy & RBAC
  orgId: z.string().optional().nullable(),
  orgRole: z.nativeEnum(UserRoleInOrg).default(UserRoleInOrg.NOT_IN_ORG),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),

  // State
  isOnboarded: z.boolean().default(false),
});

export type User = z.infer<typeof UserSchema> & BaseEntity;

// --- Input Schemas ---

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const SignUpSchema = z
  .object({
    displayName: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        message: 'Passwords do not match',
        code: 'custom',
        path: ['confirmPassword'],
      });
    }
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z
  .object({
    oobCode: z.string().min(1, 'Reset code is missing'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const VerifyEmailSchema = z.object({
  oobCode: z.string().min(1, 'Verification code is missing'),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
