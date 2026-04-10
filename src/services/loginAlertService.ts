/**
 * Login Alert Service
 * NOT: loginAlerts tablosu Supabase'de oluşturulmadı.
 * Tüm fonksiyonlar gerçek tabloya ihtiyaç duymadan sessizce çalışır.
 */

// Tablo hazır olduğunda bu flag'i true yap:
const LOGIN_ALERTS_ENABLED = false;

export const recordLoginAndCheckSuspicious = async (_studentId: string): Promise<void> => {
  if (!LOGIN_ALERTS_ENABLED) return;
  // Tablo hazır olduğunda buraya gerçek Supabase kodu gelecek
};

export const getSuspiciousLogins = async (_limitCount: number = 20) => {
  if (!LOGIN_ALERTS_ENABLED) return [];
  return [];
};
