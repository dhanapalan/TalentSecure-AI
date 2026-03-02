import { query, queryOne } from "../config/database.js";
import { logger } from "../config/logger.js";
import { getIO } from "../config/socket.js";
import { v4 as uuidv4 } from "uuid";

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    created_at: Date;
}

// ── Ensure Notifications Table Exists ────────────────────────────────────────

export async function ensureNotificationTable(): Promise<void> {
    try {
        await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    `);
        logger.info("✓ Notifications table ready");
    } catch (err) {
        logger.error("Failed to ensure notifications table:", err);
    }
}

// ── Write Notification ────────────────────────────────────────────────────────

export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = "info"
): Promise<Notification | null> {
    try {
        const id = uuidv4();
        const notification = await queryOne<Notification>(
            `INSERT INTO notifications (id, user_id, title, message, type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
            [id, userId, title, message, type]
        );

        if (notification) {
            // Broadcast via Socket.IO directly to the user's specific room
            try {
                const io = getIO();
                io.to(`user:${userId}`).emit("notification", notification);
            } catch (err) {
                // If socket isn't ready or fails, don't crash the save
                logger.error(`Failed to emit real-time notification to user ${userId}:`, err);
            }
        }

        return notification;
    } catch (err) {
        logger.error(`Failed to write notification for user ${userId}:`, err);
        return null;
    }
}

// ── Query Notifications ──────────────────────────────────────────────────────

export async function getUserNotifications(userId: string, unreadOnly: boolean = false, limit: number = 50) {
    const conditions = ["user_id = $1"];
    const params: any[] = [userId];

    if (unreadOnly) {
        conditions.push("is_read = FALSE");
    }

    const where = conditions.join(" AND ");

    return query<Notification>(
        `SELECT * FROM notifications
         WHERE ${where}
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
    );
}

// ── Action: Mark as Read ─────────────────────────────────────────────────────

export async function markAsRead(notificationId: string, userId: string) {
    return queryOne<Notification>(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
    );
}

export async function markAllAsRead(userId: string) {
    await query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
    );
}
