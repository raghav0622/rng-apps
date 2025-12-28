import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { UserRoleInOrg } from '@/core/action-policies';
import { z } from 'zod';

// --- Shared Field Definitions ---
const emailField = z.string().email('Invalid email address');
const passwordField = z.string().min(6, 'Password must be at least 6 characters').max(100);

// --- Entities ---

export const UserSchema = z.object({
  id: z.string(),
  email: emailField,
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
  email: emailField,
  password: z.string().min(1, 'Password is required'), // Allow legacy weak passwords for login if any
});

export const SignUpSchema = z
  .object({
    displayName: z.string().min(3, 'Name is too short').max(50),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const ForgotPasswordSchema = z.object({
  email: emailField,
});

export const ResetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
