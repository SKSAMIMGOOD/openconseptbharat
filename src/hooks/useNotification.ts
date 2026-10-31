"use client";

import { useCallback, useState } from "react";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (item: Omit<NotificationItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newNotification: NotificationItem = { ...item, id };

      setNotifications((prev) => [...prev, newNotification]);

      if (item.duration !== 0) {
        const timeout = item.duration ?? 5000;
        setTimeout(() => {
          removeNotification(id);
        }, timeout);
      }

      return id;
    },
    [removeNotification]
  );

  return {
    notifications,
    notify,
    removeNotification,
  };
}
