import { userRepository } from '@/core/auth/user.repository'; // Import user repo
import { AbstractService } from '@/lib/abstract-service/AbstractService';
import { EMAIL_FROM, resend } from '@/lib/email';
import { Result } from '@/lib/types';
import { AppErrorCode, CustomError } from '@/lib/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import {
  NotificationChannel,
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
        // Fetch user email
        const user = await userRepository.get(userId);
        if (user && user.email) {
          try {
            await resend.emails.send({
              from: EMAIL_FROM,
              to: user.email,
              subject: payload.title,
              html: `
                <p><strong>${payload.title}</strong></p>
                <p>${payload.message}</p>
                ${payload.link ? `<p><a href="${process.env.NEXT_PUBLIC_APP_URL}${payload.link}">View Details</a></p>` : ''}
                <hr />
                <p style="font-size: 12px; color: #666;">
                  You received this email because you have notifications enabled for <strong>${payload.topic}</strong>.
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile">Manage Preferences</a>
                </p>
              `,
            });
          } catch (error) {
            console.error('[Notification] Failed to send email:', error);
            // Don't throw, just log. Notification failure shouldn't block the main flow.
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

      // Batch update (Optimization: Use Firestore batch in real app)
      await Promise.all(
        unread.data.map((n) =>
          notificationRepository.update(n.id, { isRead: true, readAt: new Date() }),
        ),
      );
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
