import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';

/**
 * Supabase realtime üzerinden settings.system_config değişikliklerini dinler.
 * kahoot_launched_at bu oturumda daha önce görülmemiş yeni bir değere geçtiğinde,
 * Kahoot linkini yeni sekmede BIR KEZ açar.
 *
 * sessionStorage kullanarak sekme yenilemelerinde tekrar açılmasını engeller.
 * Sadece ajan ekranında aktif edilmeli (enabled=true) — admin asla kullanmaz.
 */
export const useKahootLauncher = (enabled: boolean) => {
  const lastSeenRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const baseline = async () => {
      const { data } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'system_config')
        .maybeSingle();
      const launchedAt: number = (data?.data as Record<string, number> | null)?.kahoot_launched_at || 0;
      const stored = Number(sessionStorage.getItem('kahoot_last_seen') || '0');
      lastSeenRef.current = Math.max(launchedAt, stored);
      sessionStorage.setItem('kahoot_last_seen', String(lastSeenRef.current));
    };
    baseline();

    const channel = supabase
      .channel('kahoot_broadcast')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.system_config' },
        (payload) => {
          const next = (payload.new as Record<string, unknown> | null)?.data as Record<string, unknown> | undefined;
          if (!next) return;
          const launchedAt = (next.kahoot_launched_at as number) || 0;
          const link = ((next.kahoot_link as string) || '').trim();
          if (launchedAt > lastSeenRef.current && link) {
            lastSeenRef.current = launchedAt;
            sessionStorage.setItem('kahoot_last_seen', String(launchedAt));
            const win = window.open(link, '_blank', 'noopener,noreferrer');
            if (!win) {
              window.dispatchEvent(new CustomEvent('kahoot-popup-blocked', { detail: { link } }));
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [enabled]);
};
