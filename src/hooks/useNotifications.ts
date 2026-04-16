import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { getSettingStore } from '../services/dbFirebase';

const NOTIFICATIONS_ENABLED = true;

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'lesson' | 'feedback' | 'system' | 'admin' | 'emergency' | 'info';
  is_read: boolean;
  created_at: number;
}

export const useNotifications = (studentId: string | null) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchStats = async () => {
    if (!studentId) return;
    try {
      // Fetch from notifications table (User-specific OR 'all')
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, message, type, is_read, created_at')
        .or(`user_id.eq.${studentId},user_id.eq.all`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const appNotifs: AppNotification[] = (data || []).map(n => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        message: n.message || '',
        type: n.type || 'system',
        is_read: n.is_read,
        created_at: new Date(n.created_at).getTime(),
      }));

      setNotifications(appNotifs);
      setUnreadCount(appNotifs.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (!studentId || !NOTIFICATIONS_ENABLED) return;
    
    fetchStats();
    
    // listen to notifications updates
    const channelName = `notifs_hybrid_${studentId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications'
      }, (payload) => {
        const newRecord = payload.new as any;
        const oldRecord = payload.old as any;
        
        // If it's an insert or update for this user or 'all', refetch
        if (
          (newRecord && (newRecord.user_id === studentId || newRecord.user_id === 'all')) ||
          (oldRecord && (oldRecord.user_id === studentId || oldRecord.user_id === 'all'))
        ) {
          fetchStats();
        }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  const markAsRead = async (notifId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
      // Local update for speed
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllRead = async () => {
    if (!studentId) return;
    try {
      await supabase.from('notifications')
        .update({ is_read: true })
        .or(`user_id.eq.${studentId},user_id.eq.all`)
        .eq('is_read', false);
      fetchStats();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return { notifications, unreadCount, markAsRead, markAllRead };
};

export const sendNotificationToAll = async (
  studentIds: string[],
  notification: Omit<AppNotification, 'id' | 'user_id' | 'is_read' | 'created_at'>
) => {
  if (!NOTIFICATIONS_ENABLED) return;
  try {
    const rows = studentIds.map(id => ({
      user_id: id,
      title: notification.title,
      message: notification.message,
      type: notification.type
    }));
    await supabase.from('notifications').insert(rows);
  } catch (err) {
    console.error('Error sending batch notifications:', err);
  }
};

export const sendNotification = async (
  studentIdOrAll: string,
  notification: Omit<AppNotification, 'id' | 'user_id' | 'is_read' | 'created_at'>
) => {
  if (!NOTIFICATIONS_ENABLED) return;
  try {
    await supabase.from('notifications').insert({
      user_id: studentIdOrAll,
      title: notification.title,
      message: notification.message,
      type: notification.type
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};

