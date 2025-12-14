import { db } from './neonService';

export interface CreateNotificationInput {
    userId: string;
    title: string;
    message: string;
    type: 'post_published' | 'post_failed' | 'integration_error' | 'other';
    metadata?: Record<string, any>;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    created_at: string;
    metadata?: Record<string, any>;
}

/**
 * Notification Service
 * Manages user notifications for post publishing, failures, and other events
 */
class NotificationService {
    /**
     * Create a new notification for a user
     */
    async createNotification(input: CreateNotificationInput): Promise<Notification> {
        try {
            const notification = await db<Notification>`
        INSERT INTO notifications (user_id, title, message, type, read, created_at, metadata)
        VALUES (${input.userId}, ${input.title}, ${input.message}, ${input.type}, false, NOW(), ${JSON.stringify(input.metadata || {})})
        RETURNING *
      `;

            if (!notification || notification.length === 0) {
                throw new Error('Failed to create notification');
            }

            return notification[0];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to create notification: ${errorMessage}`);
        }
    }

    /**
     * Get all unread notifications for a user
     */
    async getUnreadNotifications(userId: string): Promise<Notification[]> {
        try {
            const notifications = await db<Notification[]>`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} AND read = false
        ORDER BY created_at DESC
        LIMIT 50
      `;

            return notifications || [];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to get unread notifications: ${errorMessage}`);
            return [];
        }
    }

    /**
     * Get all notifications for a user (paginated)
     */
    async getUserNotifications(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
        try {
            const notifications = await db<Notification[]>`
        SELECT * FROM notifications 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

            return notifications || [];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to get notifications: ${errorMessage}`);
            return [];
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string): Promise<Notification | null> {
        try {
            const result = await db<Notification>`
        UPDATE notifications 
        SET read = true 
        WHERE id = ${notificationId}
        RETURNING *
      `;

            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to mark notification as read: ${errorMessage}`);
            return null;
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<number> {
        try {
            await db`
        UPDATE notifications 
        SET read = true 
        WHERE user_id = ${userId} AND read = false
      `;

            // Return count of updated notifications
            const result = await db<{ count: number }>`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ${userId} AND read = true
      `;

            return result && result.length > 0 ? result[0].count : 0;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to mark all notifications as read: ${errorMessage}`);
            return 0;
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string): Promise<boolean> {
        try {
            await db`
        DELETE FROM notifications 
        WHERE id = ${notificationId}
      `;

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to delete notification: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Delete all notifications for a user
     */
    async deleteAllUserNotifications(userId: string): Promise<number> {
        try {
            // First get the count
            const countResult = await db<{ count: number }>`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ${userId}
      `;

            const count = countResult && countResult.length > 0 ? countResult[0].count : 0;

            // Then delete
            await db`
        DELETE FROM notifications 
        WHERE user_id = ${userId}
      `;

            return count;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to delete all notifications: ${errorMessage}`);
            return 0;
        }
    }

    /**
     * Get unread notification count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const result = await db<{ count: number }>`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ${userId} AND read = false
      `;

            return result && result.length > 0 ? result[0].count : 0;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to get unread count: ${errorMessage}`);
            return 0;
        }
    }
}

export const notificationService = new NotificationService();
