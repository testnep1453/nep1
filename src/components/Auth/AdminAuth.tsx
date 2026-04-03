/**
 * Admin (1002) Giriş Bileşeni
 * İlk girişte şifre belirleme, sonrasında şifre ile giriş
 * Hibrit: Firestore öncelikli, izin hatası olursa localStorage fallback
 */

import { useState, useEffect } from 'react';

interface AdminAuthProps {
  adminName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// SHA-256 hash (client-side)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'nep_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- Hibrit Storage: Firestore → localStorage fallback ---

const ADMIN_LS_KEY = 'nep_admin_auth_hash';

const saveAdminHash = async (hash: string): Promise<void> => {
  // Önce Firestore'a yaz
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('../../config/firebase');
    await setDoc(doc(db, 'admin', 'auth'), {
      passwordHash: hash,
      createdAt: Date.now(),
    });
    // Firestore başarılı → localStorage'a da yedekle
    localStorage.setItem(ADMIN_LS_KEY, hash);
    return;
  } catch (e) {
    console.warn('Firestore admin yazma hatası, localStorage kullanılıyor:', e);
  }

  // Firestore başarısız → localStorage'a yaz
  localStorage.setItem(ADMIN_LS_KEY, hash);
};

const getAdminHash = async (): Promise<string | null> => {
  // Önce Firestore'dan oku
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../../config/firebase');
    const snap = await getDoc(doc(db, 'admin', 'auth'));
    if (snap.exists() && snap.data().passwordHash) {
      const hash = snap.data().passwordHash;
      // localStorage'a da yedekle
      localStorage.setItem(ADMIN_LS_KEY, hash);
      return hash;
    }
  } catch (e) {
    console.warn('Firestore admin okuma hatası, localStorage kontrol ediliyor:', e);
  }

  // Firestore'da yoksa veya hata verdiyse → localStorage'dan oku
  const lsHash = localStorage.getItem(ADMIN_LS_KEY);
  return lsHash || null;
};

// --- Bileşen ---

export const AdminAuth = ({ adminName, onSuccess, onCancel }: AdminAuthProps) => {
  const [mode, setMode] = useState<'loading' | 'setup' | 'login'>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    const hash = await getAdminHash();
    if (hash) {
      setMode('login');
    } else {
      setMode('setup');
    }
  };

  // İlk kez şifre oluşturma
  const handleSetup = async () => {
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const hashed = await hashPassword(password);
      await saveAdminHash(hashed);
      onSuccess();
    } catch {
      setError('Şifre kaydedilemedi. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Giriş
  const handleLogin = async () => {
    if (!password) {
      setError('Şifre girin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const savedHash = await getAdminHash();
      if (!savedHash) {
        setMode('setup');
        setLoading(false);
        return;
      }

      const hashed = await hashPassword(password);
      if (hashed === savedHash) {
        onSuccess();
      } else {
        setError('Yanlış şifre!');
      }
    } catch {
      setError('Giriş hatası. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'loading') {
    return (
      <div className="min-h-[100dvh] w-full bg-[#050505] flex items-center justify-center">
        <div className="text-[#39FF14] text-xl font-bold animate-pulse tracking-widest">
          YETKİ KONTROL EDİLİYOR...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
      </div>

      <div className="w-full max-w-sm z-10 relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👑</div>
          <h1 className="text-2xl font-bold text-[#39FF14] tracking-widest uppercase">
            KOMUTA MERKEZİ
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {adminName}
          </p>
        </div>

        {/* Setup Mode */}
        {mode === 'setup' && (
          <div className="space-y-4">
            <div className="bg-[#0A1128] border border-[#39FF14]/20 rounded-lg p-4 mb-4">
              <p className="text-[#39FF14] text-xs font-mono tracking-widest text-center">
                İLK GİRİŞ — ŞİFRE BELİRLE
              </p>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Yeni şifre (min 6 karakter)"
              className="w-full bg-[#0A1128] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] rounded-lg font-mono transition-colors"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifreyi tekrar girin"
              onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
              className="w-full bg-[#0A1128] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] rounded-lg font-mono transition-colors"
            />

            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full bg-[#39FF14]/20 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14] py-3 font-bold transition-all uppercase tracking-widest rounded-lg disabled:opacity-50 min-h-[48px]"
            >
              {loading ? 'KAYDEDİLİYOR...' : 'ŞİFREYİ KAYDET'}
            </button>
          </div>
        )}

        {/* Login Mode */}
        {mode === 'login' && (
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              autoFocus
              className="w-full bg-[#0A1128] border border-gray-700 text-white p-4 focus:outline-none focus:border-[#39FF14] rounded-lg font-mono text-center text-xl tracking-widest transition-colors"
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#39FF14]/20 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14] py-3 font-bold transition-all uppercase tracking-widest rounded-lg disabled:opacity-50 min-h-[48px]"
            >
              {loading ? 'DOĞRULANIYOR...' : 'GİRİŞ YAP'}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-[#FF4500]/10 border border-[#FF4500]/30 rounded-lg p-3 text-center">
            <p className="text-[#FF4500] text-sm font-bold">{error}</p>
          </div>
        )}

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="w-full mt-4 text-gray-600 hover:text-gray-400 text-sm font-bold uppercase tracking-widest transition-colors py-2 min-h-[48px]"
        >
          Geri Dön
        </button>
      </div>
    </div>
  );
};
