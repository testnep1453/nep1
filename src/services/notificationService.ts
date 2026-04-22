/**
 * Notification Service
 * Standalone functions for sending notifications via Supabase.
 * Separated from useNotifications hook to prevent circular dependency:
 *   useAutoMessages → useNotifications → supabaseService → (back)
 */

import { supabase } from '../config/supabase';

const NOTIFICATIONS_ENABLED = true;

export const sendNotificationToAll = async (
  studentIds: string[],
  notification: { title: string; body: string }
) => {
  if (!NOTIFICATIONS_ENABLED) return;
  try {
    const timestamp = new Date().toISOString();
    const rows = studentIds.map(id => ({
      user_id: String(id),
      title: notification.title || 'Sistem Mesajı',
      body: notification.body || '',
      is_read: false,
      created_at: timestamp
    }));
    await supabase.from('notifications').insert(rows);
  } catch (err) {
    console.error('Error sending batch notifications:', err);
  }
};

export const sendNotification = async (
  studentIdOrAll: string,
  notification: { title: string; body: string }
) => {
  if (!NOTIFICATIONS_ENABLED) return;
  try {
    await supabase.from('notifications').insert({
      user_id: String(studentIdOrAll),
      title: notification.title || 'Sistem Mesajı',
      body: notification.body || '',
      is_read: false,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};
