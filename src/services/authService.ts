import { supabase } from '../config/supabase';
// ... diğer importlar aynı

// YENİ: ADMİN YETKİLERİ VE GÜVENLİK AKSİYONLARI
export const deleteSecurityAlert = async (alertId: string) => {
  const { error } = await supabase.from('security_alerts').delete().eq('id', alertId);
  return !error;
};

export const notifyAdminSuspiciousActivity = async (email: string, reason: string) => {
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipRes.json();
    
    await supabase.from('security_alerts').insert({
      email,
      ip_address: ip,
      reason,
      user_agent: navigator.userAgent,
      severity: 'HIGH' // Kritiklik seviyesi
    });
  } catch (e) {
    console.error('Loglama başarısız', e);
  }
};
// ... geri kalan sendVerificationCode vb. fonksiyonlar öncekiyle aynı kalacak
