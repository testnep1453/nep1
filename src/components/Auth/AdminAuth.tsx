import React, { useState, useEffect } from 'react';
import { Shield, Key, Loader2, ArrowLeft } from 'lucide-react';
import { getAdminAuth, saveAdminPassword } from '../../services/dbFirebase'; 

// YENİ: Şifreleme motorunu direkt buraya aldık, crypto.ts hatası tarihe karıştı!
const hashPin = async (pin: string) => {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminAuth: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authData = await getAdminAuth();
      setIsFirstTime(!authData);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('Parola en az 4 haneli olmalıdır.');
      return;
    }

    setLoading(true);
    const hashedPin = await hashPin(pin);

    if (isFirstTime) {
      await saveAdminPassword(hashedPin); // Supabase'e kalıcı kayıt!
      onSuccess();
    } else {
      const authData = await getAdminAuth();
      if (authData && authData.passwordHash === hashedPin) {
        onSuccess();
      } else {
        setError('Hatalı parola.');
        setPin('');
      }
    }
    setLoading(false);
  };

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Yönetici Erişimi</h2>
        <p className="text-slate-400 text-center mb-6">
          {isFirstTime ? 'Sistemi kurmak için yeni bir admin parolası belirleyin.' : 'Devam etmek için yönetici parolasını girin.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              placeholder={isFirstTime ? "Yeni Parola Belirle" : "Parola Girin"}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Geri Dön
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isFirstTime ? 'Kaydet' : 'Giriş Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
