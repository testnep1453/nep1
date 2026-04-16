import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { getSettingStore } from '../services/dbFirebase';

const NOTIFICATIONS_ENABLED = true;

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'lesson' | 'feedback' | 'system' | 'admin' | 'emergency' | 'info';
  read: boolean;
  createdAt: number;
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
        .select('*')
        .or(`user_id.eq.${studentId},user_id.eq.all`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const appNotifs: AppNotification[] = (data || []).map(n => ({
        id: n.id,
        title: n.title,
        body: n.body || n.content || '',
        type: n.type || 'system',
        read: n.is_read,
        createdAt: new Date(n.created_at).getTime(),
      }));

      setNotifications(appNotifs);
      setUnreadCount(appNotifs.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (!studentId || !NOTIFICATIONS_ENABLED) return;
    
    fetchStats();
    
    // listen to notifications updates
    // Realtime filter is limited, so we listen to the table and filter locally or just refetch
    const channel = supabase.channel(`notifs_hybrid_${studentId}`)
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
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
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
  notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  if (!NOTIFICATIONS_ENABLED) return;
  try {
    const rows = studentIds.map(id => ({
      user_id: id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      is_read: false
    }));
    await supabase.from('notifications').insert(rows);
  } catch (err) {
    console.error('Error sending batch notifications:', err);
  }
};

export const sendNotification = async (
  studentIdOrAll: string,
  notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  if (!NOTIFICATIONS_ENABLED) return;
  try {
    await supabase.from('notifications').insert({
      user_id: studentIdOrAll,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      is_read: false
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};
