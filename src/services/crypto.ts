// AES-256-GCM ile istemci tarafı şifreleme
// Firebase'e yazılan hassas veriler şifrelenir, sadece bu istemcide çözülür.
// Anahtar localStorage'da saklanır — gerçek güvenlik Firebase kurallarıyle sağlanır.

const CRYPTO_KEY_STORAGE = 'nep_crypto_key';

let cachedKey: CryptoKey | null = null;

// Anahtar oluştur veya mevcut olanı kullan
export const getCryptoKey = async (): Promise<CryptoKey> => {
  if (cachedKey) return cachedKey;

  const stored = localStorage.getItem(CRYPTO_KEY_STORAGE);
  if (stored) {
    const rawKey = Uint8Array.from(JSON.parse(stored));
    cachedKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );
    return cachedKey;
  }

  // Yeni anahtar oluştur
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  localStorage.setItem(CRYPTO_KEY_STORAGE, JSON.stringify(Array.from(rawKey)));
  cachedKey = key;
  return key;
};

// Metni şifrele
export const encryptText = async (text: string): Promise<string> => {
  const key = await getCryptoKey();
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
    const key = await getCryptoKey();
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

