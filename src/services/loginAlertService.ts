import { supabase } from '../config/supabase';

/**
 * ⚠️ LOGIN_ALERTS_ENABLED:
 * Supabase'de `login_alerts` tablosu oluşturulduktan sonra `true` yapın.
 * Tablo yokken `true` bırakmak 404 konsol hatasına neden olur.
 *
 * Tablo şeması:
 *   id           uuid primary key default gen_random_uuid()
 *   student_id   text not null
 *   browser      text
 *   is_desktop   boolean
 *   device_name  text
 *   alert_reason text
 *   created_at   timestamptz default now()
 */
const LOGIN_ALERTS_ENABLED = false;

/**
 * Kullanıcı giriş yaptığında cihaz bilgilerini kaydeder.
 * LOGIN_ALERTS_ENABLED false ise sessizce çıkar — konsola hata basmaz.
 */
export const recordLoginAndCheckSuspicious = async (studentId: string): Promise<void> => {
  if (!LOGIN_ALERTS_ENABLED) return;
  try {
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
  if (!LOGIN_ALERTS_ENABLED) return [];
  try {
    const { data } = await supabase.from('login_alerts').select('*').order('created_at', { ascending: false }).limit(200);
    return data || [];
  } catch {
    return [];
  }
};

export const getSuspiciousLogins = async (_limitCount: number = 20) => {
  if (!LOGIN_ALERTS_ENABLED) return [];
  return [];
};
