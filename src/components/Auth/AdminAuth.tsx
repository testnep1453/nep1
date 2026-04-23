import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Key, Loader2, ArrowLeft, ShieldCheck, HelpCircle,
  CheckCircle2, Smartphone, Copy, Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { notifyAdminSuspiciousActivity } from '../../services/authService';
import {
  verifyAdminPassword,
  changeAdminPassword,
  startAdminSession,
  resetAdminToTempPassword,
  TEMP_PASSWORD_DISPLAY,
  generateTotpSecret,
  verifyTotpCodeFromSecret,
  saveTotpSecret,
  verifyTotpCode,
  isTotpSetup,
} from '../../services/adminSessionService';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  adminName?: string;
  adminEmail?: string;
}

type Step = 'password' | 'changePassword' | 'forgot' | 'totpSetup' | 'totpVerify';

export const AdminAuth: React.FC<Props> = ({ onSuccess, onCancel, adminEmail }) => {
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [pendingTotp, setPendingTotp] = useState<{ secret: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [pwdAttempts, setPwdAttempts] = useState(0);
  const [totpAttempts, setTotpAttempts] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const proceedAfterPassword = async () => {
    const setup = await isTotpSetup();
    if (!setup) {
      const { secret, otpauthUrl } = generateTotpSecret();
      setPendingTotp({ secret, url: otpauthUrl });
      setStep('totpSetup');
    } else {
      setStep('totpVerify');
    }
    setTotpCode('');
    setError('');
    setInfo('');
  };

  const handleTotpFailure = (next: number, hint = '') => {
    setTotpAttempts(next);
    setTotpCode('');
    if (next >= 5) {
      setError('5 kez hatalı kod. Güvenlik kilidi devrede.');
      setCooldown(900);
      notifyAdminSuspiciousActivity(adminEmail || 'admin', 'Admin TOTP doğrulama 5 kez hatalı girildi.');
    } else {
      setError(`Hatalı kod.${hint} Kalan hak: ${5 - next}`);
    }
  };

  // --- Parola doğrula ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) { setError('Parola en az 4 karakter olmalı.'); return; }
    if (cooldown > 0) return;
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
        notifyAdminSuspiciousActivity(adminEmail || 'admin', 'Admin parolası 5 kez hatalı girildi.');
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

    await proceedAfterPassword();
    setLoading(false);
  };

  // --- Şifre değiştir ---
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

    await proceedAfterPassword();
    setLoading(false);
  };

  // --- TOTP İlk Kurulum ---
  const handleTotpSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) { setError('6 haneli kodu girin.'); return; }
    if (cooldown > 0 || !pendingTotp) return;
    setError(''); setLoading(true);

    if (!verifyTotpCodeFromSecret(totpCode, pendingTotp.secret)) {
      handleTotpFailure(totpAttempts + 1, ' Uygulamayı kontrol et.');
      setLoading(false);
      return;
    }

    await saveTotpSecret(pendingTotp.secret);
    await startAdminSession();
    setLoading(false);
    onSuccess();
  };

  // --- TOTP Doğrulama ---
  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) { setError('6 haneli kodu girin.'); return; }
    if (cooldown > 0) return;
    setError(''); setLoading(true);

    if (!await verifyTotpCode(totpCode)) {
      handleTotpFailure(totpAttempts + 1);
      setLoading(false);
      return;
    }

    await startAdminSession();
    setLoading(false);
    onSuccess();
  };

  // --- Şifremi unuttum (e-posta zaten doğrulanmış) ---
  const handleForgotReset = async () => {
    setError(''); setLoading(true);
    await resetAdminToTempPassword();
    setIsForgotDone(true);
    setInfo(`Parolanız "${TEMP_PASSWORD_DISPLAY}" olarak sıfırlandı. Bu parola ile giriş yapın.`);
    setStep('password');
    setPassword('');
    setLoading(false);
  };
  const [isForgotDone, setIsForgotDone] = useState(false);

  const handleCopySecret = async () => {
    if (!pendingTotp) return;
    try {
      await navigator.clipboard.writeText(pendingTotp.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  const stepTitle: Record<Step, string> = {
    password: 'Parola Girişi',
    changePassword: 'Parola Yenileme',
    forgot: 'Parola Sıfırlama',
    totpSetup: 'Kimlik Doğrulayıcı Kur',
    totpVerify: '2FA Doğrulama',
  };

  const stepSub: Record<Step, string> = {
    password: 'Yönetici parolanızı girin.',
    changePassword: 'Yeni parolanızı 2 kez girin.',
    forgot: 'Parolanız geçici şifreye sıfırlanacak.',
    totpSetup: 'QR kodu Ente Auth veya Google Authenticator ile tara.',
    totpVerify: 'Kimlik doğrulayıcı uygulamandan 6 haneli kodu girin.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-xl overflow-hidden">
      <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-y-auto overflow-x-hidden max-h-[90vh]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#39FF14]/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex flex-col items-center mb-6 relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border bg-white/5 border-white/10">
            {(step === 'totpSetup' || step === 'totpVerify')
              ? <Smartphone className="text-[#39FF14] w-8 h-8" />
              : <ShieldAlert className="text-[#39FF14] w-8 h-8" />
            }
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">{stepTitle[step]}</h2>
          <p className="text-slate-400 text-sm text-center mt-2">{stepSub[step]}</p>
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

        {step === 'totpSetup' && pendingTotp && (
          <form onSubmit={handleTotpSetup} className="space-y-5">
            <div className="bg-white p-4 rounded-2xl flex items-center justify-center mx-auto w-fit">
              <QRCodeSVG value={pendingTotp.url} size={180} level="M" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-400">
                <strong className="text-white">Ente Auth</strong> veya <strong className="text-white">Google Authenticator</strong> uygulamasını aç,
                QR'ı tara, uygulamadaki 6 haneli kodu aşağıya yaz.
              </p>
              <button type="button" onClick={handleCopySecret}
                className="mt-2 flex items-center gap-2 mx-auto text-[10px] font-mono text-slate-500 hover:text-[#39FF14] border border-white/10 hover:border-[#39FF14]/30 px-3 py-1.5 rounded-lg transition-all">
                {copied ? <Check className="w-3 h-3 text-[#39FF14]" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Kopyalandı' : 'Secret\'ı kopyala (manuel giriş için)'}
              </button>
            </div>
            <input
              id="totp-setup-code" name="totp-setup-code" autoComplete="one-time-code"
              type="text" inputMode="numeric" maxLength={6}
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••" autoFocus required
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-3xl tracking-[0.4em] font-mono text-white focus:border-[#39FF14]/50 outline-none"
            />
            <button type="submit" disabled={loading || cooldown > 0 || totpCode.length !== 6}
              className="w-full py-3.5 rounded-xl font-bold bg-[#39FF14] text-black hover:bg-[#32e011] disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : cooldown > 0 ? `Kilitli ${cooldown}s` : 'Doğrula ve Aktifleştir'}
            </button>
          </form>
        )}

        {step === 'totpVerify' && (
          <form onSubmit={handleTotpVerify} className="space-y-5">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-[#39FF14]" />
              </div>
            </div>
            <input
              id="totp-verify-code" name="totp-verify-code" autoComplete="one-time-code"
              type="text" inputMode="numeric" maxLength={6}
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••" autoFocus required
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-3xl tracking-[0.4em] font-mono text-white focus:border-[#39FF14]/50 outline-none"
            />
            {cooldown > 0 && (
              <p className="text-center text-xs text-red-400 flex items-center justify-center gap-1">
                Kilitli: {cooldown}s
              </p>
            )}
            <button type="submit" disabled={loading || cooldown > 0 || totpCode.length !== 6}
              className="w-full py-3.5 rounded-xl font-bold bg-[#39FF14] text-black hover:bg-[#32e011] disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Giriş Yap'}
            </button>
          </form>
        )}

        {step === 'forgot' && (
          <div className="space-y-5">
            <p className="text-xs text-slate-400 text-center">
              E-postanız zaten doğrulanmış. Parolanızı geçici olarak
              "<b>{TEMP_PASSWORD_DISPLAY}</b>" şeklinde sıfırlayabilirsiniz.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep('password'); setError(''); setInfo(''); }}
                className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
              <button type="button" onClick={handleForgotReset} disabled={loading}
                className="flex-1 py-3.5 rounded-xl font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sıfırla'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase justify-center">
            <ShieldCheck className="w-3 h-3 text-[#39FF14]" /> Bcrypt + TOTP + Tek Cihaz
          </div>
        </div>
      </div>
    </div>
  );
};
