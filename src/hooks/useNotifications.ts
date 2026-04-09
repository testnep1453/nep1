import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'lesson' | 'feedback' | 'system' | 'admin';
  read: boolean;
  createdAt: number;
}

export const useNotifications = (studentId: string | null) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!studentId) return;

    const fetchNotifs = async () => {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('studentId', studentId)
          .order('createdAt', { ascending: false });
        const notifs = (data as AppNotification[]) || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifs();

    const channel = supabase
      .channel(`notifications_${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifs)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  const markAsRead = async (notifId: string) => {
    if (!studentId) return;
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.warn('Bildirim okundu hatası:', e);
    }
  };

  const markAllRead = async () => {
    if (!studentId) return;
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', n.id);
      } catch {}
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllRead };
};

// Admin: tüm öğrencilere bildirim gönder
export const sendNotificationToAll = async (
  studentIds: string[],
  notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  const rows = studentIds.map(sid => ({
    studentId: sid,
    ...notification,
    read: false,
    createdAt: Date.now(),
  }));
  try {
    await supabase.from('notifications').insert(rows);
  } catch {}
};

// Tek öğrenciye bildirim gönder
export const sendNotification = async (
  studentId: string,
  notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  try {
    await supabase.from('notifications').insert([{
      studentId,
      ...notification,
      read: false,
      createdAt: Date.now(),
    }]);
  } catch {}
};
