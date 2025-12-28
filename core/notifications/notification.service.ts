import { userRepository } from '@/core/auth/user.repository';
import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { EMAIL_FROM, resend } from '@/lib/email';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import {
  NotificationChannel,
  NotificationPreferences,
  NotificationTopic,
  NotificationType,
} from './notification.model';
import {
  notificationPreferencesRepository,
  notificationRepository,
} from './notification.repository';

class NotificationService extends AbstractService {
  /**
   * Sends a notification to a user.
   * Checks preferences before sending via external channels (Email, SMS).
   * Always writes to In-App feed if enabled.
   */
  async send(
    userId: string,
    payload: {
      topic: NotificationTopic;
      title: string;
      message: string;
      type?: NotificationType;
      orgId?: string;
      link?: string;
      metadata?: any;
    },
  ): Promise<Result<void>> {
    return this.handleOperation('notification.send', async () => {
      const prefs = await notificationPreferencesRepository.getPreferences(userId);
      const enabledChannels = prefs.channels[payload.topic] || [];

      // 1. In-App Notification (Write to DB)
      if (enabledChannels.includes(NotificationChannel.IN_APP)) {
        await notificationRepository.create(uuidv4(), {
          userId,
          orgId: payload.orgId,
          title: payload.title,
          message: payload.message,
          topic: payload.topic,
          type: payload.type || NotificationType.INFO,
          link: payload.link,
          metadata: payload.metadata,
          isRead: false,
        });
      }

      // 2. Email Notification (Real Resend Integration)
      if (enabledChannels.includes(NotificationChannel.EMAIL)) {
        const user = await userRepository.get(userId);
        if (user && user.email) {
          const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: user.email,
            subject: payload.title,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333;">${payload.title}</h2>
                <p style="color: #555; line-height: 1.6;">${payload.message}</p>
                ${payload.link ? `
                  <div style="margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}${payload.link}" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                       View Details
                    </a>
                  </div>
                ` : ''}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 12px; color: #999;">
                  You received this email because you have notifications enabled for <strong>${payload.topic}</strong>.
                  <br />
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" style="color: #007bff;">Manage Notification Preferences</a>
                </p>
              </div>
            `,
          });

          if (error) {
            console.error('[Notification] Resend Error:', error);
          } else {
            console.log('[Notification] Email sent via Resend:', data?.id);
          }
        }
      }
    });
  }

  /**
   * Marks a notification as read.
   */
  async markAsRead(userId: string, notificationId: string): Promise<Result<void>> {
    return this.handleOperation('notification.markRead', async () => {
      const notif = await notificationRepository.get(notificationId);
      if (!notif) throw new CustomError(AppErrorCode.NOT_FOUND, 'Notification not found');
      if (notif.userId !== userId) throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Access denied');

      await notificationRepository.update(notificationId, {
        isRead: true,
        readAt: new Date(),
      });
    });
  }

  /**
   * Deletes a notification.
   */
  async deleteNotification(userId: string, notificationId: string): Promise<Result<void>> {
    return this.handleOperation('notification.delete', async () => {
      const notif = await notificationRepository.get(notificationId);
      if (!notif) throw new CustomError(AppErrorCode.NOT_FOUND, 'Notification not found');
      if (notif.userId !== userId) throw new CustomError(AppErrorCode.PERMISSION_DENIED, 'Access denied');

      await notificationRepository.forceDelete(notificationId);
    });
  }

  /**
   * Deletes ALL notifications for a user.
   */
  async deleteAllNotifications(userId: string): Promise<Result<void>> {
    return this.handleOperation('notification.deleteAll', async () => {
      const notifications = await notificationRepository.list({
        where: [{ field: 'userId', op: '==', value: userId }],
      });

      await Promise.all(
        notifications.data.map((n) =>
          notificationRepository.forceDelete(n.id)
        ),
      );
    });
  }

  /**
   * Marks ALL notifications as read for a user.
   */
  async markAllRead(userId: string): Promise<Result<void>> {
    return this.handleOperation('notification.markAllRead', async () => {
      const unread = await notificationRepository.list({
        where: [
          { field: 'userId', op: '==', value: userId },
          { field: 'isRead', op: '==', value: false },
        ],
      });

      await Promise.all(
        unread.data.map((n) =>
          notificationRepository.update(n.id, { isRead: true, readAt: new Date() }),
        ),
      );
    });
  }

  /**
   * Gets user notification preferences.
   */
  async getPreferences(userId: string): Promise<Result<NotificationPreferences>> {
    return this.handleOperation('notification.getPreferences', async () => {
      return await notificationPreferencesRepository.getPreferences(userId);
    });
  }

  /**
   * Updates user notification preferences.
   */
  async updatePreferences(
    userId: string,
    topic: NotificationTopic,
    channels: NotificationChannel[],
  ): Promise<Result<void>> {
    return this.handleOperation('notification.updatePreferences', async () => {
      const prefs = await notificationPreferencesRepository.getPreferences(userId);
      
      const updatedChannels = {
        ...prefs.channels,
        [topic]: channels,
      };

      await notificationPreferencesRepository.update(userId, {
        channels: updatedChannels,
      });
    });
  }
}

export const notificationService = new NotificationService();
