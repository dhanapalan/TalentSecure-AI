import { useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import { connectGeneralSocket, disconnectGeneralSocket } from "../lib/socket";
import { useAuthStore } from "../stores/authStore";
import toast from "react-hot-toast";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface DashboardNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    created_at: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const user = useAuthStore((s) => s.user);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get("/notifications?limit=20");
            if (res.data?.success) {
                setNotifications(res.data.data);
                setUnreadCount(res.data.data.filter((n: DashboardNotification) => !n.is_read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const res = await api.put(`/notifications/${id}/read`);
            if (res.data?.success) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await api.put("/notifications/read-all");
            if (res.data?.success) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, is_read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    useEffect(() => {
        if (!user?.id) return;

        fetchNotifications();

        const socket = connectGeneralSocket();

        // Join the user's personal channel
        socket.emit("join-user", user.id);

        const handleNewNotification = (notification: DashboardNotification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show toast
            if (notification.type === 'success') toast.success(notification.title + ": " + notification.message);
            else if (notification.type === 'error') toast.error(notification.title + ": " + notification.message);
            else toast(notification.title + ": " + notification.message, { icon: '🔔' });
        };

        socket.on("notification", handleNewNotification);

        return () => {
            socket.off("notification", handleNewNotification);
            disconnectGeneralSocket();
        };
    }, [user?.id, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications
    };
}
