import { BaseEntity } from '@/core/abstract-firestore-repository/types';
import { z } from 'zod';

// --- Types ---

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum NotificationTopic {
  SECURITY = 'security', // Password changes, logins
  BILLING = 'billing', // Invoices, payment failures
  TEAM = 'team', // Invites, role changes
  SYSTEM = 'system', // Maintenance, announcements
}

// --- Entities ---

/**
 * 🔔 Notification Entity
 * Stores an individual alert for a user.
 */
export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  orgId: z.string().optional(), // If related to an org

  title: z.string(),
  message: z.string(),
  type: z.nativeEnum(NotificationType).default(NotificationType.INFO),
  topic: z.nativeEnum(NotificationTopic).default(NotificationTopic.SYSTEM),
  
  link: z.string().optional(), // Action URL
  metadata: z.record(z.string(), z.any()).optional(),

  isRead: z.boolean().default(false),
  readAt: z.date().optional().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Notification = z.infer<typeof NotificationSchema> & BaseEntity;

/**
 * ⚙️ Notification Preferences Entity
 * Stores user settings for which channels they want active per topic.
 */
export const NotificationPreferencesSchema = z.object({
  id: z.string(), // Matches userId
  
  // Map Topic -> Array of Enabled Channels
  channels: z.record(
    z.nativeEnum(NotificationTopic),
    z.array(z.nativeEnum(NotificationChannel))
  ),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema> & BaseEntity;

// --- Default Preferences ---
export const DEFAULT_NOTIFICATION_PREFERENCES: Partial<NotificationPreferences> = {
  channels: {
    [NotificationTopic.SECURITY]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    [NotificationTopic.BILLING]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    [NotificationTopic.TEAM]: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    [NotificationTopic.SYSTEM]: [NotificationChannel.IN_APP],
  },
};

// --- Actions Inputs ---
export const UpdatePreferencesSchema = z.object({
  topic: z.nativeEnum(NotificationTopic),
  channels: z.array(z.nativeEnum(NotificationChannel)),
});

export const MarkReadSchema = z.object({
  notificationId: z.string(),
});
