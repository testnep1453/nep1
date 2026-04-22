// Admin oturum ve şifre güvenliği servisi
// Tek cihaz kilidi, IP/UA bağlama, 60 gün şifre yenileme, geçici şifre zorunlu değişim

import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

const ADMIN_AUTH_KEY = 'admin_auth';
const ADMIN_SESSION_KEY = 'admin_session_token';
const PASSWORD_MAX_AGE_DAYS = 60;
const DEFAULT_TEMP_PASSWORD = 'YeniGeciciSifre2024';
const IP_ALERT_THRESHOLD = 3; // 1 saatte farklı IP'den bu kadar yanlış → alarm
const IP_ALERT_WINDOW_MS = 60 * 60 * 1000;

// -- Tipler --
export interface AdminAuthData {
  adminHash: string;
  updatedAt: number;
  setupDate: string;
  // YENİ ALANLAR:
  mustChangePassword?: boolean;
  passwordChangedAt?: number;
  currentSessionToken?: string;
  currentSessionDevice?: string;
  currentSessionIp?: string;
  currentSessionUA?: string;
  lastLoginIp?: string;
  recentFailures?: Array<{ ip: string; ua: string; at: number }>;
}

interface CheckResult {
  ok: boolean;
  error?: string;
  mustChange?: boolean; // true ise şifre değiştirme ekranına yönlendir
}

// -- Helpers --
const fetchIp = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const json = await res.json();
    return json.ip || 'bilinmiyor';
  } catch {
    return 'bilinmiyor';
  }
};

const generateSessionToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

const getDeviceFingerprint = (): string => {
  const raw = `${navigator.userAgent}|${navigator.platform}|${screen.width}x${screen.height}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

// -- Ana servis fonksiyonları --

export const getAdminAuthData = async (): Promise<AdminAuthData | null> => {
  const { data } = await supabase
    .from('settings')
    .select('data')
    .eq('id', ADMIN_AUTH_KEY)
    .maybeSingle();
  return (data?.data as AdminAuthData) || null;
};

const saveAdminAuthData = async (updates: Partial<AdminAuthData>): Promise<boolean> => {
  const existing = (await getAdminAuthData()) || { adminHash: '', updatedAt: 0, setupDate: '' };
  const merged: AdminAuthData = { ...existing, ...updates, updatedAt: Date.now() };
  const { error } = await supabase.from('settings').upsert({ id: ADMIN_AUTH_KEY, data: merged });
  return !error;
};

/**
 * Geçici şifreyi sisteme kur. Eğer kayıt yoksa YeniGeciciSifre2024'ü hash'ler
 * ve mustChangePassword=true ile kaydeder.
 * Önce kayıt boşsa çağrılır (ilk kurulum veya SQL'le sıfırlanmış).
 */
export const ensureTempPasswordInitialized = async (): Promise<void> => {
  const current = await getAdminAuthData();
  if (current?.adminHash && current.adminHash.trim() !== '') return;

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(DEFAULT_TEMP_PASSWORD, salt);

  await supabase.from('settings').upsert({
    id: ADMIN_AUTH_KEY,
    data: {
      adminHash: hash,
      updatedAt: Date.now(),
      setupDate: new Date().toISOString(),
      mustChangePassword: true,
      passwordChangedAt: 0, // 0 = hiç değişmedi, geçici şifre
    } as AdminAuthData,
  });
};

/**
 * Admin şifresini doğrular ve şifre yaşını kontrol eder.
 */
export const verifyAdminPassword = async (password: string): Promise<CheckResult> => {
  await ensureTempPasswordInitialized();
  const data = await getAdminAuthData();
  if (!data) return { ok: false, error: 'Sistem hatası: admin kaydı bulunamadı.' };

  const match = await bcrypt.compare(password, data.adminHash);

  if (!match) {
    await recordFailedAttempt();
    return { ok: false, error: 'Hatalı yönetici parolası!' };
  }

  // Geçici şifre veya 60 gün dolduysa → şifre değiştirme zorunlu
  const now = Date.now();
  const changedAt = data.passwordChangedAt || 0;
  const ageDays = changedAt > 0 ? (now - changedAt) / (1000 * 60 * 60 * 24) : Infinity;

  if (data.mustChangePassword || ageDays >= PASSWORD_MAX_AGE_DAYS) {
    return { ok: true, mustChange: true };
  }

  return { ok: true, mustChange: false };
};

/**
 * Yeni şifreyi kur (2 kez giriş sonrası çağrılır).
 * Eski şifre kontrolü de burada yapılır.
 */
export const changeAdminPassword = async (
  oldPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> => {
  const data = await getAdminAuthData();
  if (!data) return { ok: false, error: 'Sistem hatası.' };

  const match = await bcrypt.compare(oldPassword, data.adminHash);
  if (!match) return { ok: false, error: 'Mevcut parola yanlış!' };

  // Yeni şifre eskisiyle aynı olmasın
  const sameAsOld = await bcrypt.compare(newPassword, data.adminHash);
  if (sameAsOld) return { ok: false, error: 'Yeni şifre eskisiyle aynı olamaz.' };

  // Güç kontrolleri
  if (newPassword.length < 10) return { ok: false, error: 'Şifre en az 10 karakter olmalı.' };
  if (!/[A-Z]/.test(newPassword)) return { ok: false, error: 'En az bir büyük harf içermeli.' };
  if (!/[a-z]/.test(newPassword)) return { ok: false, error: 'En az bir küçük harf içermeli.' };
  if (!/\d/.test(newPassword)) return { ok: false, error: 'En az bir rakam içermeli.' };

  const salt = await bcrypt.genSalt(12);
  const newHash = await bcrypt.hash(newPassword, salt);

  const saved = await saveAdminAuthData({
    adminHash: newHash,
    mustChangePassword: false,
    passwordChangedAt: Date.now(),
  });

  if (!saved) return { ok: false, error: 'Kayıt sırasında hata oluştu.' };
  return { ok: true };
};

/**
 * Admin giriş başarılı olunca çağrılır: yeni oturum açar,
 * varsa eski oturumu geçersiz kılar.
 */
export const startAdminSession = async (): Promise<string> => {
  const token = generateSessionToken();
  const ip = await fetchIp();
  const ua = navigator.userAgent;
  const device = getDeviceFingerprint();

  await saveAdminAuthData({
    currentSessionToken: token,
    currentSessionDevice: device,
    currentSessionIp: ip,
    currentSessionUA: ua,
    lastLoginIp: ip,
  });

  localStorage.setItem(ADMIN_SESSION_KEY, token);
  return token;
};

/**
 * Tarayıcıdaki oturumun hâlâ geçerli olduğunu kontrol et.
 * Başka cihaz giriş yaptıysa bu false döner → anında çıkış.
 */
export const validateAdminSession = async (): Promise<boolean> => {
  const localToken = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!localToken) return false;

  const data = await getAdminAuthData();
  if (!data?.currentSessionToken) return false;

  // Token eşleşmiyorsa başka cihaz girmiş demektir
  if (data.currentSessionToken !== localToken) return false;

  // Cihaz parmak izi eşleşmiyorsa ya oturum çalındı ya karıştı
  const device = getDeviceFingerprint();
  if (data.currentSessionDevice && data.currentSessionDevice !== device) return false;

  return true;
};

export const endAdminSession = async (): Promise<void> => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  await saveAdminAuthData({
    currentSessionToken: '',
    currentSessionDevice: '',
    currentSessionIp: '',
    currentSessionUA: '',
  });
};

/**
 * Yanlış parola denemesi kaydet. 1 saat içinde farklı IP'den 3+ yanlış → security_alerts.
 */
const recordFailedAttempt = async (): Promise<void> => {
  try {
    const ip = await fetchIp();
    const ua = navigator.userAgent;
    const now = Date.now();

    const data = await getAdminAuthData();
    const recent = (data?.recentFailures || []).filter(f => now - f.at < IP_ALERT_WINDOW_MS);
    recent.push({ ip, ua, at: now });

    // Son 20 kaydı tut
    const trimmed = recent.slice(-20);

    // Farklı IP'leri say
    const uniqueIps = new Set(trimmed.map(f => f.ip));

    await saveAdminAuthData({ recentFailures: trimmed });

    if (uniqueIps.size >= IP_ALERT_THRESHOLD) {
      // security_alerts tablosuna yaz
      await supabase.from('security_alerts').insert({
        email: 'admin@nep',
        ip_address: ip,
        reason: `Admin paneline farklı IP'lerden (${uniqueIps.size}) hatalı parola denemesi`,
        user_agent: ua,
      });
    }
  } catch {
    // sessiz
  }
};

/**
 * İlk girişte veya şifre sıfırlama sonrası geçici şifreyi zorla kur.
 * Şifremi unuttum akışında kullanılabilir.
 */
export const resetAdminToTempPassword = async (): Promise<boolean> => {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(DEFAULT_TEMP_PASSWORD, salt);
  return saveAdminAuthData({
    adminHash: hash,
    mustChangePassword: true,
    passwordChangedAt: 0,
    currentSessionToken: '',
  });
};

export const TEMP_PASSWORD_DISPLAY = DEFAULT_TEMP_PASSWORD;
