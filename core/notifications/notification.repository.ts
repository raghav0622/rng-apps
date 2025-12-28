import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import { RepositoryError } from '@/core/abstract-firestore-repository/types';
import {
    DEFAULT_NOTIFICATION_PREFERENCES,
    Notification,
    NotificationPreferences,
    NotificationPreferencesSchema,
    NotificationSchema,
} from './notification.model';

// --- Notification Repository ---
class NotificationRepository extends AbstractFirestoreRepository<Notification> {
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
class NotificationPreferencesRepository extends AbstractFirestoreRepository<NotificationPreferences> {
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
    try {
      // Try to get existing preferences
      // This will throw RepositoryError('Not found', 'NOT_FOUND') if the document doesn't exist.
      return await this.get(userId);
    } catch (error: any) {
      // If error is NOT_FOUND, we create defaults. Otherwise rethrow.
      if (
        (error instanceof RepositoryError && error.code === 'NOT_FOUND') ||
        error.message === 'Not found' || 
        error.message === 'Entity not found'
      ) {
        // Defaults not found, create them.
        const defaultPrefsData = {
          id: userId,
          channels: DEFAULT_NOTIFICATION_PREFERENCES.channels!,
        };
        
        await this.create(userId, defaultPrefsData);

        // Return the in-memory object, conforming to the entity type.
        return {
          ...defaultPrefsData,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        } as NotificationPreferences;
      }

      // Re-throw unexpected errors
      throw error;
    }
  }
}

export const notificationPreferencesRepository = new NotificationPreferencesRepository();
