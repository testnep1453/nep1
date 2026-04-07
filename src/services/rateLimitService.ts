/**
 * Rate Limiting Service
 * 
 * Firestore timestamp tabanlı sunucu taraflı frekans kontrolü.
 * Arayüzde buton gizlemek yetmez — Firestore'da da timestamp kontrolü var.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

interface RateLimitConfig {
  /** Minimum bekleme süresi (ms) */
  cooldownMs: number;
  /** Firestore alan adı */
  field: string;
}

// Rate limit konfigürasyonları
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  emailVerification: { cooldownMs: 60_000, field: 'lastEmailVerification' },      // 1 dakika
  emailChange: { cooldownMs: 24 * 60 * 60 * 1000, field: 'lastEmailChange' },     // 24 saat
  feedback: { cooldownMs: 5 * 60 * 1000, field: 'lastFeedback' },                 // 5 dakika
  nicknameChange: { cooldownMs: 60 * 60 * 1000, field: 'lastNicknameChange' },    // 1 saat
};

/**
 * Rate limit kontrolü yap
 * @returns { allowed: boolean, remainingMs: number }
 */
export const checkRateLimit = async (action: string): Promise<{ allowed: boolean; remainingMs: number }> => {
  const user = auth.currentUser;
  if (!user) return { allowed: false, remainingMs: 0 };

  const config = RATE_LIMITS[action];
  if (!config) return { allowed: true, remainingMs: 0 };

  try {
    const rateLimitRef = doc(db, 'rateLimits', user.uid);
    const snap = await getDoc(rateLimitRef);

    if (!snap.exists()) {
      return { allowed: true, remainingMs: 0 };
    }

    const data = snap.data();
    const lastAction = data[config.field];

    if (!lastAction) {
      return { allowed: true, remainingMs: 0 };
    }

    // Firestore Timestamp → ms
    const lastMs = lastAction.toMillis ? lastAction.toMillis() : lastAction;
    const elapsed = Date.now() - lastMs;
    const remaining = config.cooldownMs - elapsed;

    if (remaining > 0) {
      return { allowed: false, remainingMs: remaining };
    }

    return { allowed: true, remainingMs: 0 };
  } catch {
    // Hata durumunda izin ver (defensive)
    return { allowed: true, remainingMs: 0 };
  }
};

/**
 * Rate limit kaydını güncelle (işlem yapıldıktan sonra çağır)
 */
export const recordAction = async (action: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const config = RATE_LIMITS[action];
  if (!config) return;

  try {
    const rateLimitRef = doc(db, 'rateLimits', user.uid);
    await setDoc(rateLimitRef, {
      [config.field]: serverTimestamp(),
    }, { merge: true });
  } catch {
    // Sessiz
  }
};

/**
 * Kalan süreyi insan-okunabilir formata çevir
 */
export const formatCooldown = (ms: number): string => {
  if (ms <= 0) return '';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} saniye`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} dakika`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} saat`;
};
