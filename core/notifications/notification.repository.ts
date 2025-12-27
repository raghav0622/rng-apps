import { FirestoreRepository } from '@/lib/firestore-repository/firestore-repository';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  Notification,
  NotificationPreferences,
  NotificationPreferencesSchema,
  NotificationSchema,
} from './notification.model';

// --- Notification Repository ---
class NotificationRepository extends FirestoreRepository<Notification> {
  constructor() {
    super('notifications', {
      schema: NotificationSchema,
      softDeleteEnabled: false,
    });
  }

  async getUserNotifications(userId: string, limit = 20) {
    const { data } = await this.list({
      where: [{ field: 'userId', op: '==', value: userId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit,
    });
    return data;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { data } = await this.list({
      where: [
        { field: 'userId', op: '==', value: userId },
        { field: 'isRead', op: '==', value: false },
      ],
    });
    return data.length;
  }
}

export const notificationRepository = new NotificationRepository();

// --- Preferences Repository ---
class NotificationPreferencesRepository extends FirestoreRepository<NotificationPreferences> {
  constructor() {
    super('notification_preferences', {
      schema: NotificationPreferencesSchema,
      softDeleteEnabled: false,
    });
  }

  /**
   * Get user preferences, creating defaults if they don't exist.
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const prefs = await this.get(userId);
    if (prefs) return prefs;

    // Create defaults
    return await this.create(userId, {
      id: userId,
      channels: DEFAULT_NOTIFICATION_PREFERENCES.channels!,
    });
  }
}

export const notificationPreferencesRepository = new NotificationPreferencesRepository();
