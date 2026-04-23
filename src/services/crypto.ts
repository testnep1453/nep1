// AES-256-GCM ile istemci tarafı şifreleme
// Anahtar, VITE_ADMIN_ID'den PBKDF2 ile türetilir — tüm oturumlarda deterministik.

let cachedKey: CryptoKey | null = null;

export const clearCachedKey = () => { cachedKey = null; };

const deriveKeyFromAdminId = async (): Promise<CryptoKey> => {
  if (cachedKey) return cachedKey;

  const adminId = String(import.meta.env.VITE_ADMIN_ID ?? '1002');
  const salt = 'nep-totp-salt-v1';

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(adminId + salt),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  cachedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedKey;
};

// Metni şifrele
export const encryptText = async (text: string): Promise<string> => {
  const key = await deriveKeyFromAdminId();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...result));
};

// Metnin şifresini çöz
export const decryptText = async (encryptedBase64: string): Promise<string | null> => {
  try {
    const key = await deriveKeyFromAdminId();
    const data = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
};

// --- CİHAZ İZLEME (Fingerprint) ---

export interface DeviceRecord {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  deviceType: 'mobil' | 'tablet' | 'masaüstü';
  isTouchDevice: boolean;
  fingerprint: string;
  firstSeen: number;
}

// Basit cihaz fingerprint
const generateFingerprint = (deviceInfo: Omit<DeviceRecord, 'fingerprint' | 'firstSeen'>): string => {
  const raw = `${deviceInfo.userAgent}|${deviceInfo.platform}|${deviceInfo.screenResolution}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export const detectDeviceType = (): 'mobil' | 'tablet' | 'masaüstü' => {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) {
    if (/iPad|Tablet/i.test(ua)) return 'tablet';
    return 'mobil';
  }
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  return 'masaüstü';
};

export const getDeviceInfo = (): DeviceRecord => {
  const deviceType = detectDeviceType();
  const info = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    deviceType,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };

  return {
    ...info,
    fingerprint: generateFingerprint(info),
    firstSeen: Date.now(),
  };
};

