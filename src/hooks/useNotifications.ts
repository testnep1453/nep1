import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const NOTIFICATIONS_ENABLED = true;

export interface AppNotification {
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: number | string; // Numeric timestamp in state, but string in DB
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
        .select('user_id, title, body, is_read, created_at')
        .or(`user_id.eq.${studentId},user_id.eq.all`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const appNotifs: AppNotification[] = (data || []).map((n: any) => ({
        userId: n.user_id,
        title: n.title || 'Bildirim',
        body: n.body || '',
        isRead: n.is_read || false,
        createdAt: n.created_at // Keeping as raw for comparison, UI will format
      }));

      setNotifications(appNotifs);
      setUnreadCount(appNotifs.filter(n => !n.isRead).length);
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

  const markAsRead = async (notif: AppNotification) => {
    try {
      // Since 'id' is removed, we match by content and timestamp
      await supabase.from('notifications')
        .update({ is_read: true })
        .match({ 
          user_id: notif.userId, 
          created_at: notif.createdAt,
          title: notif.title
        });
        
      // Local update for speed
      setNotifications(prev => prev.map(n => 
        (n.createdAt === notif.createdAt && n.userId === notif.userId) ? { ...n, isRead: true } : n
      ));
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
