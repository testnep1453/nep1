import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { getSystemConfig } from '../services/systemSettingsService';

/**
 * Supabase realtime üzerinden settings.system_config değişikliklerini dinler.
 * kahoot_launched_at bu oturumda daha önce görülmemiş yeni bir değere geçtiğinde,
 * Kahoot linkini yeni sekmede BIR KEZ açar.
 *
 * Baseline DB fetch tamamlanmadan kanal subscribe edilmez — race condition önlenir.
 * sessionStorage kullanarak sekme yenilemelerinde tekrar açılmasını engeller.
 * Sadece ajan ekranında aktif edilmeli (enabled=true) — admin asla kullanmaz.
 */
export const useKahootLauncher = (enabled: boolean) => {
  const lastSeenRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      // Mevcut DB değerini baseline olarak al — gereksiz yere popup açılmasını engeller
      const cfg = await getSystemConfig();
      const launchedAt = cfg.kahoot_launched_at || 0;
      const stored = Number(sessionStorage.getItem('kahoot_last_seen') || '0');
      lastSeenRef.current = Math.max(launchedAt, stored);
      sessionStorage.setItem('kahoot_last_seen', String(lastSeenRef.current));

      if (cancelled) return;

      // Baseline tamamlandıktan sonra subscribe et — erken gelen event false positive yaratmaz
      channel = supabase
        .channel('kahoot_broadcast')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.system_config' },
          (payload) => {
            const next = (payload.new as Record<string, unknown> | null)?.data as Record<string, unknown> | undefined;
            if (!next) return;
            const nextLaunchedAt = (next.kahoot_launched_at as number) || 0;
            const link = ((next.kahoot_link as string) || '').trim();
            if (nextLaunchedAt > lastSeenRef.current && link) {
              lastSeenRef.current = nextLaunchedAt;
              sessionStorage.setItem('kahoot_last_seen', String(nextLaunchedAt));
              const win = window.open(link, '_blank', 'noopener,noreferrer');
              if (!win) {
                window.dispatchEvent(new CustomEvent('kahoot-popup-blocked', { detail: { link } }));
              }
            }
          }
        )
        .subscribe();
    };

    init();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [enabled]);
};
