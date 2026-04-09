/**
 * Rate Limiting Service - Supabase tabanlı
 * localStorage fallback ile çalışır
 */

interface RateLimitConfig {
  cooldownMs: number;
  field: string;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  emailVerification: { cooldownMs: 60_000, field: 'lastEmailVerification' },
  emailChange: { cooldownMs: 24 * 60 * 60 * 1000, field: 'lastEmailChange' },
  feedback: { cooldownMs: 5 * 60 * 1000, field: 'lastFeedback' },
  nicknameChange: { cooldownMs: 60 * 60 * 1000, field: 'lastNicknameChange' },
};

export const checkRateLimit = async (action: string): Promise<{ allowed: boolean; remainingMs: number }> => {
  const config = RATE_LIMITS[action];
  if (!config) return { allowed: true, remainingMs: 0 };

  try {
    const stored = localStorage.getItem(`rateLimit_${action}`);
    if (!stored) return { allowed: true, remainingMs: 0 };

    const lastMs = parseInt(stored, 10);
    const elapsed = Date.now() - lastMs;
    const remaining = config.cooldownMs - elapsed;

    if (remaining > 0) return { allowed: false, remainingMs: remaining };
    return { allowed: true, remainingMs: 0 };
  } catch {
    return { allowed: true, remainingMs: 0 };
  }
};

export const recordAction = async (action: string): Promise<void> => {
  try {
    localStorage.setItem(`rateLimit_${action}`, Date.now().toString());
  } catch {
    // sessiz
  }
};

export const formatCooldown = (ms: number): string => {
  if (ms <= 0) return '';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} saniye`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} dakika`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} saat`;
};
