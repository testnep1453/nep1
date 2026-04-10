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
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('studentId', studentId)
          .order('createdAt', { ascending: false });
        // 404 → tablo henüz oluşturulmamış, sessizce geç
        if (error?.code === '42P01' || error?.message?.includes('does not exist')) return;
        const notifs = (data as AppNotification[]) || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch {
        // Ağ/izin hatası — sessiz
      }
    };

    fetchNotifs();
    // Realtime aboneliği sadece kurar, hata olursa channel otomatik kapanır
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
    } catch {
      // sessiz
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

// Admin: tüm öğrencilere bildirim gönder (notifications tablosu yoksa sessiz)
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
  } catch { /* tablo yok veya izin yok — sessiz */ }
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
  } catch { /* sessiz */ }
};
