import { useState, useEffect } from 'react';

// NOT: notifications tablosu Supabase'de henüz oluşturulmadı.
// Tablonun oluşturulması halinde Bu flag'i true yapın.
const NOTIFICATIONS_ENABLED = false;

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'lesson' | 'feedback' | 'system' | 'admin';
  read: boolean;
  createdAt: number;
}

export const useNotifications = (_studentId: string | null) => {
  const [notifications] = useState<AppNotification[]>([]);
  const [unreadCount] = useState(0);
  const markAsRead = async (_notifId: string) => {};
  const markAllRead = async () => {};
  return { notifications, unreadCount, markAsRead, markAllRead };
};

export const sendNotificationToAll = async (
  _studentIds: string[],
  _notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  if (!NOTIFICATIONS_ENABLED) return;
};

export const sendNotification = async (
  _studentId: string,
  _notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  if (!NOTIFICATIONS_ENABLED) return;
};
