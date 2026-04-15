import { supabase } from '../config/supabase';

// Tablo hazır olduğunda bu flag'i true yap:
const LOGIN_ALERTS_ENABLED = true;

/**
 * Kullanıcı giriş yaptığında cihaz bilgilerini kaydeder
 */
export const recordLoginAndCheckSuspicious = async (studentId: string): Promise<void> => {
  if (!LOGIN_ALERTS_ENABLED) return;
  try {
    const ua = navigator.userAgent;
    let browser = 'Diğer';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    
    let isDesktop = true;
    let deviceName = 'Masaüstü (PC/Mac)';
    if (/Mobi|Android/i.test(ua)) {
      isDesktop = false;
      deviceName = 'Telefon/Tablet';
    }

    await supabase.from('login_alerts').insert([{
      student_id: studentId,
      browser,
      is_desktop: isDesktop,
      device_name: deviceName,
      alert_reason: 'Normal Login'
    }]);
  } catch (error) {
    console.error('Login alert kayıt hatası:', error);
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
