/**
 * Bildirimler Paneli
 * NOT: 'notifications' tablosu Supabase'de henüz oluşturulmadı.
 * Şimdilik yalnızca 'messages' tablosundan admin duyuruları gösterilir.
 * Notifications tablosu oluşturulduğunda ilgili blok açılabilir.
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { getSettingStore, saveSettingStore } from '../../services/dbFirebase';

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
  const [readReceipts, setReadReceipts] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Yalnızca 'messages' tablosundan admin duyurularını çek
  // 'notifications' tablosu oluşturulduğunda buraya eklenebilir
  useEffect(() => {
    if (!studentId || !isOpen) return;

    const fetchAll = async () => {
      try {
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .order('date', { ascending: false })
          .limit(20);

        const reads = await getSettingStore<string[]>(`read_${studentId}`, []);
        setReadReceipts(reads || []);

        const msgNotifs: NotificationItem[] = (msgData || []).map((m: Record<string, unknown>) => {
          const nId = `msg_${m.id}`;
          return {
            id: nId,
            title: 'Admin Duyurusu',
            body: String(m.text || ''),
            type: 'admin' as const,
            read: (reads || []).includes(nId),
            createdAt: Number(m.date) || Date.now(),
          };
        });

        setNotifications(msgNotifs);
      } catch {
        setNotifications([]);
      }
    };

    fetchAll();

    // Yalnızca messages tablosunu izle
    const channel = supabase
      .channel(`notif_panel_${studentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studentId, isOpen]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'Az önce';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk önce`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} saat önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const markAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (readReceipts.includes(id)) return;
    const newReads = [...readReceipts, id];
    setReadReceipts(newReads);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await saveSettingStore(`read_${studentId}`, newReads);
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
              className={`p-3 border-b border-white/5 transition-colors ${!n.read ? 'bg-[#00F0FF]/5 hover:bg-[#00F0FF]/10' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">
                  {n.type === 'admin' ? '📢' : n.type === 'lesson' ? '📚' : '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${!n.read ? 'text-[#00F0FF]' : 'text-white/80'}`}>{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-gray-600">{formatTime(n.createdAt)}</p>
                    {!n.read && (
                      <button onClick={(e) => markAsRead(e, n.id)} className="text-[10px] font-bold text-[#39FF14] bg-[#39FF14]/10 hover:bg-[#39FF14]/20 px-2 py-0.5 rounded transition-colors uppercase tracking-widest">
                        Okundu İşaretle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
