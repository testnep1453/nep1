/**
 * Bildirimler Paneli (Notification System Overhaul)
 */

import { useEffect, useRef } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationPanelProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

export const NotificationPanel = ({ studentId, isOpen, onClose }: NotificationPanelProps) => {
  const { notifications, markAsRead, markAllRead } = useNotifications(studentId);
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

  const formatTime = (ts: number | string) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '...';
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
      className="fixed right-0 left-0 top-[52px] mx-2 sm:absolute sm:left-auto sm:mx-0 sm:right-0 sm:top-14 sm:w-80 w-auto bg-[#0A1128]/95 backdrop-blur-md border border-[#00F0FF]/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[200] flex flex-col overflow-hidden animate-fade-in"
    >
      <div className="p-4 border-b border-[#00F0FF]/20 flex items-center justify-between bg-[#00F0FF]/5">
        <div>
          <h3 className="text-sm font-bold text-[#00F0FF] uppercase tracking-[0.2em]">Bildirimler</h3>
          <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{notifications.length} KAYIT BULUNDU</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={() => markAllRead()}
            className="text-[10px] font-bold text-[#00F0FF] hover:text-white transition-all uppercase tracking-widest border border-[#00F0FF]/40 px-2 py-1 rounded bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
          >
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      <div className="flex-1 max-h-[60dvh] overflow-y-auto custom-scrollbar overscroll-contain">
        {notifications.length === 0 ? (
          <div className="p-12 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="text-4xl mb-4 animate-pulse opacity-50 filter drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">📡</div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-[#00F0FF]/40 mb-1">Status: Offline</p>
            <p className="text-xs uppercase tracking-[0.1em] font-bold text-gray-500">Veri akışı bulunamadı</p>
            <div className="mt-4 flex justify-center gap-1 opacity-20">
              <div className="w-1 h-1 bg-[#00F0FF] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1 h-1 bg-[#00F0FF] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 bg-[#00F0FF] rounded-full animate-bounce" />
            </div>
          </div>
        ) : (
          notifications.map((n, idx) => {
            const uniqueKey = `${n.user_id}_${n.created_at}_${idx}`;
            return (
              <div
                key={uniqueKey}
                className={`p-4 border-b border-white/5 transition-all relative group ${
                  !n.is_read 
                    ? 'bg-[#00F0FF]/5 cursor-pointer border-l-4 border-[#00F0FF]' 
                    : 'opacity-80'
                }`}
                onClick={() => !n.is_read && markAsRead(n)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded bg-gray-900 border flex items-center justify-center text-lg ${
                    !n.is_read 
                      ? 'border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
                      : 'border-gray-800'
                  }`}>
                    🔔
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-xs font-bold uppercase tracking-wider ${
                        !n.is_read ? 'text-[#00F0FF]' : 'text-gray-400'
                      }`}>
                        {n.title}
                      </p>
                      <span className="text-[9px] font-mono text-gray-600 whitespace-nowrap">{formatTime(n.created_at)}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${!n.is_read ? 'text-gray-200' : 'text-gray-500'}`}>{n.body}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};



