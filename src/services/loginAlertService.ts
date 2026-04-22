import { supabase } from '../config/supabase';
import { getSystemConfig } from './systemSettingsService';

/**
 * Kullanıcı giriş yaptığında cihaz bilgilerini kaydeder.
 * Supabase'deki settings -> system_config -> login_alerts_enabled ayarına bağlıdır.
 */
export const recordLoginAndCheckSuspicious = async (studentId: string): Promise<void> => {
  try {
    const config = await getSystemConfig();
    if (!config.login_alerts_enabled) return;

    const ua = navigator.userAgent;
    let browser = 'Diğer';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';

    const isDesktop = !/Mobi|Android/i.test(ua);
    const deviceName = isDesktop ? 'Masaüstü (PC/Mac)' : 'Telefon/Tablet';

    await supabase.from('login_alerts').insert([{
      student_id: studentId,
      browser,
      is_desktop: isDesktop,
      device_name: deviceName,
      alert_reason: 'Normal Login',
    }]);
  } catch {
    // Hata sessizce yutulur — tablo yoksa konsolu kirletme
  }
};

/**
 * Son 100 login logunu dondurur, dashboard icin
 */
export const getAllLoginLogs = async () => {
  try {
    const config = await getSystemConfig();
    if (!config.login_alerts_enabled) return [];
    const { data } = await supabase.from('login_alerts').select('*').order('created_at', { ascending: false }).limit(200);
    return data || [];
  } catch {
    return [];
  }
};

export const getSuspiciousLogins = async (_limitCount: number = 20) => {
  try {
    const config = await getSystemConfig();
    if (!config.login_alerts_enabled) return [];
    return [];
  } catch {
    return [];
  }
};

