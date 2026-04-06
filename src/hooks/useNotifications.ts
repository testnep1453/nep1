import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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

    try {
      const q = query(
        collection(db, 'notifications', studentId, 'items'),
        orderBy('createdAt', 'desc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as AppNotification[];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }, () => {
        setNotifications([]);
        setUnreadCount(0);
      });

      return () => unsub();
    } catch {
      return;
    }
  }, [studentId]);

  const markAsRead = async (notifId: string) => {
    if (!studentId) return;
    try {
      await updateDoc(doc(db, 'notifications', studentId, 'items', notifId), { read: true });
    } catch (e) {
      console.warn('Bildirim okundu hatası:', e);
    }
  };

  const markAllRead = async () => {
    if (!studentId) return;
    for (const n of notifications.filter(n => !n.read)) {
      try {
        await updateDoc(doc(db, 'notifications', studentId, 'items', n.id), { read: true });
      } catch {}
    }
  };

  return { notifications, unreadCount, markAsRead, markAllRead };
};

// Admin: tüm öğrencilere bildirim gönder
export const sendNotificationToAll = async (
  studentIds: string[],
  notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  for (const sid of studentIds) {
    try {
      await addDoc(collection(db, 'notifications', sid, 'items'), {
        ...notification,
        read: false,
        createdAt: Date.now(),
      });
    } catch {}
  }
};

// Tek öğrenciye bildirim gönder
export const sendNotification = async (
  studentId: string,
  notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  try {
    await addDoc(collection(db, 'notifications', studentId, 'items'), {
      ...notification,
      read: false,
      createdAt: Date.now(),
    });
  } catch {}
};
