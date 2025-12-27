'use server';

import {
  MarkReadSchema,
  UpdatePreferencesSchema,
} from '@/core/notifications/notification.model';
import {
  notificationPreferencesRepository,
  notificationRepository,
} from '@/core/notifications/notification.repository';
import { notificationService } from '@/core/notifications/notification.service';
import { authActionClient } from '@/core/safe-action/safe-action';

// --- Read Actions ---

export const getNotificationsAction = authActionClient
  .metadata({ name: 'notification.list' })
  .action(async ({ ctx }) => {
    const list = await notificationRepository.getUserNotifications(ctx.userId);
    const unreadCount = await notificationRepository.getUnreadCount(ctx.userId);
    return { list, unreadCount };
  });

export const getPreferencesAction = authActionClient
  .metadata({ name: 'notification.getPreferences' })
  .action(async ({ ctx }) => {
    return await notificationPreferencesRepository.getPreferences(ctx.userId);
  });

// --- Write Actions ---

export const markReadAction = authActionClient
  .metadata({ name: 'notification.markRead' })
  .schema(MarkReadSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await notificationService.markAsRead(ctx.userId, parsedInput.notificationId);
  });

export const markAllReadAction = authActionClient
  .metadata({ name: 'notification.markAllRead' })
  .action(async ({ ctx }) => {
    return await notificationService.markAllRead(ctx.userId);
  });

export const updatePreferencesAction = authActionClient
  .metadata({ name: 'notification.updatePreferences' })
  .schema(UpdatePreferencesSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await notificationService.updatePreferences(
      ctx.userId,
      parsedInput.topic,
      parsedInput.channels,
    );
  });
