import React, { useState, useEffect } from 'react';
import { ShieldAlert, Key, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { getAdminAuth, saveAdminPassword } from '../../services/dbFirebase'; 
import { notifyAdminSuspiciousActivity } from '../../services/authService';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  adminName?: string;
}

export const AdminAuth: React.FC<Props> = ({ onSuccess, onCancel, adminName: _adminName }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authData = await getAdminAuth();
        setIsFirstTime(!authData || !authData.admin_hash);
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('Parola en az 4 haneli olmalıdır.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isFirstTime) {
        // Yeni şifre belirleme (Bcrypt Hash)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await saveAdminPassword(hashedPassword); 
        onSuccess();
      } else {
        const authData = await getAdminAuth();
        
        if (authData && authData.admin_hash) {
          // Bcrypt Karşılaştırması
          const isMatch = await bcrypt.compare(password, authData.admin_hash);
          
          if (isMatch) {
            onSuccess();
          } else {
            setError('Hatalı yönetici parolası!');
            setPassword('');
            // GÜVENLİK: Admin parolasında hata affı yok! Anında logla ve bildir.
            notifyAdminSuspiciousActivity('YÖNETİCİ_GİRİŞİ', 'Admin paneline yetkisiz giriş denemesi (Hatalı Parola)!');
          }
        } else {
          setError('Sistem hatası: Admin yapılandırması bulunamadı.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('İşlem sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95"><Loader2 className="w-8 h-8 text-[#39FF14] animate-spin" /></div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-xl">
      <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
        {/* Dekoratif Efektler */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#39FF14]/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center mb-8 relative">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border transition-all duration-500 ${isFirstTime ? 'bg-[#39FF14]/10 border-[#39FF14]/30 shadow-[0_0_20px_rgba(57,255,20,0.2)]' : 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}>
            {isFirstTime ? <ShieldCheck className="text-[#39FF14] w-8 h-8" /> : <ShieldAlert className="text-red-500 w-8 h-8" />}
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase text-center">
            {isFirstTime ? 'Sistem Kurulumu' : 'Yönetici Erişimi'}
          </h2>
          <p className="text-slate-400 text-sm text-center mt-2">
            {isFirstTime ? 'Lütfen yeni bir yönetici parolası belirleyin.' : 'Devam etmek için yönetici parolasını girin.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Yönetici Parolası</label>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#39FF14] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder={isFirstTime ? "Yeni Parola Belirle" : "••••••••"}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition-all"
                autoFocus
              />
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-center text-red-400 text-sm font-bold animate-shake">
              <p className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> {error}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/5"
            >
              <ArrowLeft className="w-4 h-4" /> İptal
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className={`flex-1 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isFirstTime 
                  ? 'bg-[#39FF14] text-black hover:bg-[#32e011]' 
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isFirstTime ? 'Kaydet' : 'Giriş Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
