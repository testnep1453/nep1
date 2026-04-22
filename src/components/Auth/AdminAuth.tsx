import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Key, Loader2, ArrowLeft, ShieldCheck, Mail, Clock, HelpCircle, CheckCircle2
} from 'lucide-react';
import { sendVerificationCode, verifyEmailCode, notifyAdminSuspiciousActivity } from '../../services/authService';
import {
  verifyAdminPassword,
  changeAdminPassword,
  startAdminSession,
  resetAdminToTempPassword,
  TEMP_PASSWORD_DISPLAY,
} from '../../services/adminSessionService';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  adminName?: string;
  adminEmail?: string;
}

type Step = 'email' | 'otp' | 'password' | 'changePassword' | 'forgot';

export const AdminAuth: React.FC<Props> = ({ onSuccess, onCancel, adminEmail }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(adminEmail || '');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [pwdAttempts, setPwdAttempts] = useState(0);
  const [isForgotFlow, setIsForgotFlow] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // --- Adım 1: Email'e kod gönder ---
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(''); setInfo(''); setLoading(true);

    if (adminEmail && email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
      setError('Bu e-posta yönetici hesabıyla eşleşmiyor.');
      setLoading(false);
      return;
    }

    // Admin için students tablosu kontrolü atlanır
    const res = await sendVerificationCode(email, true);
    if (res.success) {
      setStep('otp');
      setCooldown(60);
      setInfo('8 haneli doğrulama kodu e-postanıza gönderildi.');
    } else {
      setError(res.message || 'Kod gönderilemedi.');
    }
    setLoading(false);
  };

  // --- Adım 2: OTP doğrula ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) { setError('Kodu eksiksiz girin.'); return; }
    setError(''); setLoading(true);

    const ok = await verifyEmailCode(email, otpCode);
    if (ok) {
      if (isForgotFlow) {
        // Şifreyi geçici değere sıfırla, kullanıcıyı parola adımına gönder
        await resetAdminToTempPassword();
        setIsForgotFlow(false);
        setInfo(`Parolanız "${TEMP_PASSWORD_DISPLAY}" olarak sıfırlandı. Şimdi bu parola ile giriş yapın.`);
        setStep('password');
        setOtpCode('');
      } else {
        setStep('password');
        setInfo('');
        setOtpCode('');
      }
    } else {
      const next = otpAttempts + 1;
      setOtpAttempts(next);
      if (next >= 3) {
        setError('3 kez hatalı kod girildi. Güvenlik kilidi devrede.');
        setCooldown(180);
        notifyAdminSuspiciousActivity(email, 'Admin OTP 3 kez hatalı girildi.');
      } else {
        setError(`Hatalı kod. Kalan hak: ${3 - next}`);
      }
    }
    setLoading(false);
  };

  // --- Adım 3: Parola doğrula ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) { setError('Parola en az 4 karakter olmalı.'); return; }
    setError(''); setLoading(true);

    const res = await verifyAdminPassword(password);

    if (!res.ok) {
      const next = pwdAttempts + 1;
      setPwdAttempts(next);
      setError(res.error || 'Hatalı parola.');
      setPassword('');
      if (next >= 5) {
        setError('5 kez hatalı parola. Güvenlik kilidi devrede.');
        setCooldown(900);
        notifyAdminSuspiciousActivity(email || 'admin', 'Admin parolası 5 kez hatalı girildi.');
      }
      setLoading(false);
      return;
    }

    if (res.mustChange) {
      setStep('changePassword');
      setInfo('Güvenlik gereği parolanızı değiştirmeniz gerekiyor.');
      setError('');
      setLoading(false);
      return;
    }

    await startAdminSession();
    setLoading(false);
    onSuccess();
  };

  // --- Adım 4: Şifre değiştir ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      setError('İki şifre aynı değil.');
      return;
    }
    setError(''); setLoading(true);

    const res = await changeAdminPassword(password, newPassword);
    if (!res.ok) {
      setError(res.error || 'Değişim başarısız.');
      setLoading(false);
      return;
    }

    await startAdminSession();
    setLoading(false);
    onSuccess();
  };

  // --- Şifremi unuttum ---
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('E-posta gerekli.'); return; }
    setError(''); setLoading(true);

    const res = await sendVerificationCode(email, true);
    if (!res.success) {
      setError(res.message || 'Kod gönderilemedi.');
      setLoading(false);
      return;
    }
    setIsForgotFlow(true);
    setInfo(`E-postanıza onay kodu gönderildi. Kodu doğruladığınızda parolanız "${TEMP_PASSWORD_DISPLAY}" olarak sıfırlanacak.`);
    setStep('otp');
    setCooldown(60);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-xl">
      <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#39FF14]/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex flex-col items-center mb-6 relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border bg-white/5 border-white/10">
            <ShieldAlert className="text-[#39FF14] w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">
            {step === 'email' && 'Yönetici Girişi'}
            {step === 'otp' && 'E-posta Doğrulama'}
            {step === 'password' && 'Parola Girişi'}
            {step === 'changePassword' && 'Parola Yenileme'}
            {step === 'forgot' && 'Parola Sıfırlama'}
          </h2>
          <p className="text-slate-400 text-sm text-center mt-2">
            {step === 'email' && 'Devam etmek için kayıtlı yönetici e-postasını girin.'}
            {step === 'otp' && `${email} adresine gönderilen 8 haneli kodu girin.`}
            {step === 'password' && 'Yönetici parolanızı girin.'}
            {step === 'changePassword' && 'Yeni parolanızı 2 kez girin.'}
            {step === 'forgot' && 'E-postanıza onay kodu gönderilecek.'}
          </p>
        </div>

        {info && (
          <div className="bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-lg p-3 mb-4 flex items-start gap-2 text-[#39FF14] text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{info}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-400 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="admin-email" name="admin-email" autoComplete="email"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@ornek.com" autoFocus required
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-[#39FF14]/50 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onCancel}
                className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> İptal
              </button>
              <button type="submit" disabled={loading || cooldown > 0}
                className="flex-1 py-3.5 rounded-xl font-bold bg-[#39FF14] text-black hover:bg-[#32e011] disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : cooldown > 0 ? `${cooldown}s` : 'Kod Gönder'}
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <input
              id="admin-otp" name="admin-otp"
              type="text" inputMode="numeric" maxLength={8}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••••" autoFocus required autoComplete="one-time-code"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-3xl tracking-[0.4em] font-mono text-white focus:border-[#39FF14]/50 outline-none"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep('email'); setError(''); setInfo(''); setOtpCode(''); setIsForgotFlow(false); }}
                className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
              <button type="submit" disabled={loading || cooldown > 0}
                className="flex-1 py-3.5 rounded-xl font-bold bg-[#39FF14] text-black hover:bg-[#32e011] disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Doğrula'}
              </button>
            </div>
            {cooldown > 0 && (
              <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Yeniden kod için {cooldown}s
              </p>
            )}
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="admin-password" name="admin-password" autoComplete="current-password"
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoFocus required
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-[#39FF14]/50 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onCancel}
                className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> İptal
              </button>
              <button type="submit" disabled={loading || cooldown > 0}
                className="flex-1 py-3.5 rounded-xl font-bold bg-[#39FF14] text-black hover:bg-[#32e011] disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : cooldown > 0 ? `${cooldown}s` : 'Giriş'}
              </button>
            </div>
            <button type="button" onClick={() => { setStep('forgot'); setError(''); setInfo(''); }}
              className="w-full text-xs text-slate-500 hover:text-[#39FF14] flex items-center justify-center gap-1">
              <HelpCircle className="w-3 h-3" /> Parolamı unuttum
            </button>
          </form>
        )}

        {step === 'changePassword' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <p className="text-xs text-slate-400 -mt-2">
              En az 10 karakter, 1 büyük, 1 küçük, 1 rakam.
            </p>
            <input
              id="new-password" name="new-password" autoComplete="new-password"
              type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Yeni parola" autoFocus required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-[#39FF14]/50 outline-none"
            />
            <input
              id="new-password-confirm" name="new-password-confirm" autoComplete="new-password"
              type="password" value={newPasswordConfirm}
              onChange={e => setNewPasswordConfirm(e.target.value)}
              placeholder="Yeni parolayı tekrar yaz" required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-[#39FF14]/50 outline-none"
            />
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold bg-[#39FF14] text-black hover:bg-[#32e011] disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Parolayı Kaydet ve Devam Et'}
            </button>
          </form>
        )}

        {step === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-5">
            <p className="text-xs text-slate-400">
              E-posta adresinizi yazın. Onay kodu gönderilecek, kodu doğrularsanız parolanız
              geçici olarak "<b>{TEMP_PASSWORD_DISPLAY}</b>" olarak sıfırlanır.
            </p>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="forgot-email" name="forgot-email" autoComplete="email"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@ornek.com" required
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-[#39FF14]/50 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep('password'); setError(''); setInfo(''); }}
                className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3.5 rounded-xl font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Parolayı Sıfırla'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase justify-center">
            <ShieldCheck className="w-3 h-3 text-[#39FF14]" /> Email OTP + Bcrypt + Tek Cihaz
          </div>
        </div>
      </div>
    </div>
  );
};
