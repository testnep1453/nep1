import React, { useState, useEffect } from 'react';
import { Mail, Loader2, ArrowLeft, Clock, ShieldCheck, HelpCircle, CheckCircle } from 'lucide-react';
import { sendVerificationCode, verifyEmailCode, notifyAdminSuspiciousActivity } from '../../services/authService';
import { Student } from '../../types/student';

interface Props {
  student: Student;
  onVerified: () => void;
  onCancel: () => void;
}

export const PasswordVerificationModal: React.FC<Props> = ({ student, onVerified, onCancel }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSpamTip, setShowSpamTip] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async () => {
    if (!student.email || cooldown > 0) return;
    setStatus('sending');
    const result = await sendVerificationCode(student.email);
    if (result.success) {
      setStatus('idle'); setCodeSent(true); setErrorMessage(''); setFailedAttempts(0); setCooldown(15); setShowSpamTip(false);
    } else {
      setStatus('error'); setErrorMessage(result.message || 'Kod gönderilemedi.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) { setErrorMessage('Lütfen kodu eksiksiz girin.'); return; }
    setStatus('verifying');
    const success = await verifyEmailCode(student.email!, code);
    if (success) {
      setStatus('success'); setFailedAttempts(0); setTimeout(() => onVerified(), 1000);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 3) {
        setStatus('error'); setErrorMessage('Güvenlik kısıtlaması aktif. Sistem loglandı.'); setCooldown(180);
        notifyAdminSuspiciousActivity(student.email!, '3 kez hatalı OTP (kimlik doğrulama) girildi.');
      } else {
        setStatus('error'); setErrorMessage(`Hatalı kod. (Kalan hak: ${3 - newAttempts})`);
      }
    }
  };

  useEffect(() => { handleSendCode(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-xl overflow-hidden">
      <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-x-hidden">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(57,255,20,0.1)]">
            <ShieldCheck className="text-[#39FF14] w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Kimlik Doğrulama</h2>
        </div>
        {!codeSent ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-slate-400 text-sm text-center">
              <span className="text-white font-medium">{student.email}</span> adresine doğrulama kodu gönderiliyor...
            </p>
            <Loader2 className="w-8 h-8 animate-spin text-[#39FF14]" />
          </div>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-1"><b>{student.email}</b> adresine kod gönderildi.</p>
              {showSpamTip && <p className="text-[#39FF14] text-xs font-medium animate-pulse">Lütfen spam (gereksiz) kutunuzu kontrol edin.</p>}
            </div>
            <input
              id="otp-code-verify" name="otp-code-verify" autoComplete="one-time-code" type="text" maxLength={8}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-3xl tracking-[0.4em] font-mono text-white focus:border-[#39FF14]/50 outline-none uppercase"
              autoFocus required
            />
            {status === 'error' && <p className="text-red-400 text-xs font-bold text-center">{errorMessage}</p>}
            {status === 'success' && (
              <div className="bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-lg p-3 flex items-center gap-2 text-[#39FF14] text-xs">
                <CheckCircle className="w-4 h-4" /><span>Doğrulama başarılı! Giriş yapılıyor...</span>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"><ArrowLeft size={16} /> İptal</button>
              <button type="submit" disabled={status === 'verifying' || status === 'success' || code.length < 6} className="flex-1 py-3.5 rounded-xl font-bold bg-[#39FF14] text-black hover:bg-[#32e011] transition-all disabled:opacity-50">
                {status === 'verifying' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Doğrula'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
