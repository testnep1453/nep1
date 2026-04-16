import React, { useState } from 'react';
import { ShieldAlert, Key, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase';
import { notifyAdminSuspiciousActivity } from '../../services/authService';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  adminName?: string;
}

export const AdminAuth: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('Parola en az 4 haneli olmalıdır.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Veritabanından admin_auth kaydını çek
      const { data: authRecord, error: fetchError } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'admin_auth')
        .maybeSingle();

      if (fetchError) throw fetchError;

      const authData = authRecord?.data as any;
      const currentHash = authData?.admin_hash;

      // 2. İlk Kurulum (Auto-Setup): Hash yoksa şifreyi kaydet ve içeri al
      if (!currentHash || currentHash.trim() === '') {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const { error: upsertError } = await supabase
          .from('settings')
          .upsert({ 
            id: 'admin_auth', 
            data: { 
              admin_hash: hashedPassword, 
              updatedAt: Date.now(),
              setupDate: new Date().toISOString()
            } 
          });

        if (upsertError) throw upsertError;
        
        completeLogin();
        return;
      }

      // 3. Normal Giriş: Hash varsa karşılaştır
      const isMatch = await bcrypt.compare(password, currentHash);
      
      if (isMatch) {
        completeLogin();
      } else {
        setError('Hatalı yönetici parolası!');
        setPassword('');
        // GÜVENLİK: Admin parolasında hata affı yok! Anında logla ve bildir.
        notifyAdminSuspiciousActivity('YÖNETİCİ_GİRİŞİ', 'Admin paneline yetkisiz giriş denemesi (Hatalı Parola)!');
      }
    } catch (err: any) {
      console.error('Kritik Auth Hatası:', err);
      setError('Veritabanı bağlantı hatası! Lütfen RLS ayarlarını kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = () => {
    // RLS engellerini aşmak ve oturum takibi için yerel saklama
    localStorage.setItem('studentId', '1002');
    localStorage.setItem('admin_session', 'active_' + Date.now());
    sessionStorage.setItem('emailVerified', 'true');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-xl">
      <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
        {/* Neon Glow Efektleri */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#39FF14]/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border bg-white/5 border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <ShieldAlert className="text-[#39FF14] w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Sistem Erişimi
          </h2>
          <p className="text-slate-400 text-sm text-center mt-2">
            Devam etmek için yönetici kimliğini doğrulayın.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 block flex items-center gap-2">
              <Key className="w-3 h-3" /> Yönetici Parolası
            </label>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#39FF14] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition-all placeholder:text-slate-700"
                autoFocus
              />
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-center text-red-400 text-sm font-bold animate-shake gap-2">
              <ShieldAlert className="w-4 h-4" /> {error}
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
              className="flex-1 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-[#39FF14] text-black hover:bg-[#32e011] shadow-[0_0_20px_rgba(57,255,20,0.2)] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Giriş Yap / Onayla'}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-tighter justify-center">
            <ShieldCheck className="w-3 h-3 text-[#39FF14]" /> Secure Database Auth Active (Bcrypt ENFORCED)
          </div>
        </div>
      </div>
    </div>
  );
};



