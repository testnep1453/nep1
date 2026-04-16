import React, { useState } from 'react';
import { ShieldAlert, Key, Loader2, ArrowLeft, Mail, Lock } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { notifyAdminSuspiciousActivity } from '../../services/authService';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  adminName?: string;
}

export const AdminAuth: React.FC<Props> = ({ onSuccess, onCancel, adminName: _adminName }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('E-posta ve parola gereklidir.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Supabase hatalarını yakala ve kullanıcı dostu mesaj dön
        if (authError.message === 'Invalid login credentials') {
          setError('Geçersiz e-posta veya parola.');
        } else {
          setError(authError.message);
        }
        
        // GÜVENLİK: Admin parolasında hata affı yok! Anında logla ve bildir.
        notifyAdminSuspiciousActivity('YÖNETİCİ_GİRİŞİ', `Yetkisiz giriş denemesi! Hedef: ${email}`);
        setLoading(false);
        return;
      }

      if (data.session) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Bir sistem hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-xl">
      <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden">
        {/* Dekoratif Işık Efekti */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#39FF14]/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)] border bg-red-500/10 border-red-500/30">
            <ShieldAlert className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Yönetici Erişimi
          </h2>
          <p className="text-slate-400 text-sm text-center mt-2">
            Devam etmek için yönetici kimlik bilgilerinizi doğrulayın.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {/* E-posta Alanı */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
              <Mail className="w-3 h-3" /> E-Posta Adresi
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="admin@nep.com"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition-all placeholder:text-slate-600"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Parola Alanı */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Parola
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition-all placeholder:text-slate-600"
                required
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

          <div className="flex gap-3 pt-4">
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
              className="flex-1 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Giriş Yap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
