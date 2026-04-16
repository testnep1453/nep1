import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { getSettingStore } from '../services/dbFirebase';

const NOTIFICATIONS_ENABLED = true;

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

  const fetchStats = async () => {
    if (!studentId || !['1001', '1003'].includes(studentId)) return;
    try {
      // Fetch from notifications table
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', studentId)
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
    if (!studentId || !NOTIFICATIONS_ENABLED || !['1001', '1003'].includes(studentId)) return;
    
    fetchStats();
    
    // listen to notifications updates
    const channel = supabase.channel(`notifs_v2_${studentId}_${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${studentId}`
      }, fetchStats)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  const markAsRead = async (notifId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
      fetchStats();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllRead = async () => {
    if (!studentId) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', studentId);
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
  studentId: string,
  notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  if (!NOTIFICATIONS_ENABLED) return;
  try {
    await supabase.from('notifications').insert({
      user_id: studentId,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      is_read: false
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};
