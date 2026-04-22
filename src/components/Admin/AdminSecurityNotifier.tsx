import React, { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { supabase } from '../../config/supabase';

// Gelen bildirimlerin tipi
interface SecurityAlert {
  id: string;
  email: string;
  ip_address: string;
  reason: string;
  created_at: string;
}

export const AdminSecurityNotifier: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  useEffect(() => {
    // Supabase security_alerts tablosunu CANLI (Realtime) dinlemeye başlıyoruz
    const subscription = supabase
      .channel('security-alerts-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_alerts' },
        (payload) => {
          const newAlert = payload.new as SecurityAlert;
          // Yeni gelen bildirimi listeye ekle ve sesi çal (opsiyonel)
          setAlerts((prev) => [...prev, newAlert]);
          
          // İstersen burada tarayıcının standart bildirim sesini çalabilirsin
          // new Audio('/notification-sound.mp3').play().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {alerts.map((alert) => (
        <div 
          key={alert.id} 
          className="bg-red-950/90 border border-red-500/50 p-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.3)] backdrop-blur-md w-80 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-1">
                GÜVENLİK İHLALİ
              </h4>
              <p className="text-white text-sm mb-1">
                <span className="font-semibold text-red-300">{alert.email}</span> adresi için şüpheli işlem!
              </p>
              <div className="text-slate-400 text-xs flex flex-col gap-0.5">
                <span>IP: {alert.ip_address}</span>
                <span>Neden: {alert.reason}</span>
              </div>
            </div>
            <button 
              onClick={() => removeAlert(alert.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};



