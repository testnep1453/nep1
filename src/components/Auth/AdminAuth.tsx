import React, { useState, useEffect } from 'react';
import { ShieldAlert, Key, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { getAdminAuth, saveAdminPassword } from '../../services/dbFirebase'; 
import { notifyAdminSuspiciousActivity } from '../../services/authService';

const hashPin = async (pin: string) => {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  adminName?: string;
}

export const AdminAuth: React.FC<Props> = ({ onSuccess, onCancel, adminName: _adminName }) => {
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
      await saveAdminPassword(hashedPin); 
      onSuccess();
    } else {
      const authData = await getAdminAuth();
      if (authData && authData.passwordHash === hashedPin) {
        onSuccess();
      } else {
        setError('Hatalı yönetici parolası!');
        setPin('');
        // GÜVENLİK: Admin parolasında hata affı yok! 1. yanlışta anında logla ve bildir.
        notifyAdminSuspiciousActivity('YÖNETİCİ_GİRİŞİ', 'Admin paneline yetkisiz giriş denemesi (Hatalı Parola)!');
      }
    }
    setLoading(false);
  };

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95"><Loader2 className="w-8 h-8 text-[#39FF14] animate-spin" /></div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-xl">
      <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.2)] border ${isFirstTime ? 'bg-[#39FF14]/10 border-[#39FF14]/30' : 'bg-red-500/10 border-red-500/30'}`}>
            {isFirstTime ? <ShieldCheck className="text-[#39FF14] w-8 h-8" /> : <ShieldAlert className="text-red-500 w-8 h-8" />}
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase text-center">Yönetici Erişimi</h2>
          <p className="text-slate-400 text-sm text-center mt-2">
            {isFirstTime ? 'Sistemi kurmak için yeni bir admin parolası belirleyin.' : 'Devam etmek için yönetici parolasını girin.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              placeholder={isFirstTime ? "Yeni Parola Belirle" : "Parolayı Girin"}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition-all"
              autoFocus
            />
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-center text-red-400 text-sm font-bold">
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> İptal Et
            </button>
            <button type="submit" disabled={loading} className={`flex-1 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isFirstTime ? 'bg-[#39FF14] text-black hover:bg-[#32e011]' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isFirstTime ? 'Kaydet' : 'Giriş Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
