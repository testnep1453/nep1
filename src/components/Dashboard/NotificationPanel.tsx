/**
 * Bildirimler Paneli (Modül 1.4)
 * Çan ikonuna tıklanınca açılır, bildirimler listelenir
 */

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'admin' | 'system' | 'lesson';
  read: boolean;
  createdAt: number;
}

interface NotificationPanelProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

export const NotificationPanel = ({ studentId, isOpen, onClose }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Firestore'dan bildirimleri dinle
  useEffect(() => {
    if (!studentId) return;

    const q = query(
      collection(db, 'notifications', studentId, 'items'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as NotificationItem[];
      setNotifications(items);
    }, () => {
      // Hata durumunda sessiz
    });

    return () => unsub();
  }, [studentId]);

  // Bildirimler ayrıca messages koleksiyonundan da gelsin (admin duyuruları)
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('date', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({
        id: `msg_${d.id}`,
        title: 'Admin Duyurusu',
        body: d.data().text || '',
        type: 'admin' as const,
        read: true, // Mesajlar her zaman okunmuş sayılır
        createdAt: d.data().date || Date.now(),
      }));
      setNotifications(prev => {
        const personalOnes = prev.filter(n => !n.id.startsWith('msg_'));
        return [...personalOnes, ...msgs].sort((a, b) => b.createdAt - a.createdAt);
      });
    }, () => {});

    return () => unsub();
  }, []);

  const markAsRead = async (notifId: string) => {
    if (notifId.startsWith('msg_')) return;
    try {
      const ref = doc(db, 'notifications', studentId, 'items', notifId);
      await updateDoc(ref, { read: true });
    } catch {
      // sessiz
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'Az önce';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk önce`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} saat önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-12 top-14 w-80 max-h-[70vh] bg-[#0A1128] border border-[#6358cc]/40 rounded-xl shadow-2xl shadow-black/50 z-[200] flex flex-col overflow-hidden animate-fade-in"
    >
      <div className="p-4 border-b border-[#6358cc]/20 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bildirimler</h3>
        <span className="text-gray-500 text-xs">{notifications.length} bildirim</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Henüz bildirim yok
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                !n.read ? 'bg-[#00F0FF]/5 border-l-2 border-l-[#00F0FF]' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">
                  {n.type === 'admin' ? '📢' : n.type === 'lesson' ? '📚' : '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/80 truncate">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{formatTime(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#00F0FF] mt-1 shrink-0" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
