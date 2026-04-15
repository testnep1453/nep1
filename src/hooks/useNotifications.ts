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

  useEffect(() => {
    if (!studentId || !NOTIFICATIONS_ENABLED || !['1001', '1003'].includes(studentId)) return;
    
    const fetchStats = async () => {
      try {
        const { data: msgData } = await supabase.from('messages').select('id');
        const reads = await getSettingStore<string[]>(`read_${studentId}`, []);
        const total = msgData ? msgData.length : 0;
        const readLen = Array.isArray(reads) ? reads.filter(id => id.startsWith('msg_')).length : 0;
        setUnreadCount(Math.max(0, total - readLen));
      } catch {}
    };

    fetchStats();
    
    // listen to messages updates
    const channel = supabase.channel(`notifs_${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchStats)
      .subscribe();
      
    // interval for polling reading status from panel updates 
    const intv = setInterval(fetchStats, 5000);

    return () => { supabase.removeChannel(channel); clearInterval(intv); };
  }, [studentId]);

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
