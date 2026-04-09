/**
 * Login Alert Service - Supabase tabanlı
 */

import { supabase } from '../config/supabase';

export const recordLoginAndCheckSuspicious = async (studentId: string): Promise<void> => {
  const currentUA = navigator.userAgent;
  const currentPlatform = navigator.platform;

  try {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const { data: recentLogins } = await supabase
      .from('loginAlerts')
      .select('*')
      .eq('studentId', studentId)
      .gt('timestamp', oneDayAgo)
      .order('timestamp', { ascending: false })
      .limit(5);

    let isSuspicious = false;
    let reason = '';

    if (recentLogins && recentLogins.length > 0) {
      const differentDevice = recentLogins.find(
        (login: { userAgent: string; platform: string; timestamp: number }) =>
          login.userAgent !== currentUA || login.platform !== currentPlatform
      );

      if (differentDevice) {
        if (Date.now() - (differentDevice as { timestamp: number }).timestamp < 10 * 60 * 1000) {
          isSuspicious = true;
          reason = `Aynı hesaba 10dk içinde farklı cihazdan giriş: ${currentUA.slice(0, 50)}`;
        }
      }
    }

    await supabase.from('loginAlerts').insert([{
      studentId,
      userAgent: currentUA,
      platform: currentPlatform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: Date.now(),
      isSuspicious,
      reason: reason || null,
    }]);
  } catch {
    // sessiz
  }
};

export const getSuspiciousLogins = async (limitCount: number = 20) => {
  try {
    const { data } = await supabase
      .from('loginAlerts')
      .select('*')
      .eq('isSuspicious', true)
      .order('timestamp', { ascending: false })
      .limit(limitCount);
    return data || [];
  } catch {
    return [];
  }
};
