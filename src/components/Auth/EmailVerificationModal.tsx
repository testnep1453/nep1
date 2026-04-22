import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft, Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import { sendVerificationCode, verifyEmailCode, notifyAdminSuspiciousActivity } from '../../services/authService';

interface Props {
  studentId: string;
  onVerified: (email: string) => void;
  // GÜVENLİK: onCancel artık zorunlu değil. Ana dosya göndermeyi unutsa bile sistem çökmeyecek.
  onCancel?: () => void; 
}

export const EmailVerificationModal: React.FC<Props> = ({ studentId, onVerified, onCancel }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [status, setStatus] = useState<'idle' | 'sending' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSpamTip, setShowSpamTip] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || cooldown > 0) return; 
    
    setStatus('sending');
    const result = await sendVerificationCode(email);
    
    if (result.success) {
      setStatus('idle');
      setStep('code');
      setErrorMessage('');
      setFailedAttempts(0);
      setCooldown(60); 
      setShowSpamTip(false);
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'İşlem başarısız.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setErrorMessage('Lütfen kodu eksiksiz girin.');
      return;
    }
    
    setStatus('verifying');
    const success = await verifyEmailCode(email, code);
    
    if (success) {
      setStatus('success');
      setFailedAttempts(0);
      setTimeout(() => onVerified(email), 1000);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setStatus('error');
        setErrorMessage('Güvenlik kısıtlaması aktif. Sistem loglandı.');
        setCooldown(180); 
        notifyAdminSuspiciousActivity(email, '3 kez hatalı OTP (doğrulama kodu) girildi.');
      } else {
        setStatus('error');
        setErrorMessage(`Hatalı kod. (Kalan hak: ${3 - newAttempts})`);
      }
    }
  };

  // ÇÖKME ENGELLEYİCİ: onCancel gelse de gelmese de seni ID ekranına götürecek zırhlı fonksiyon
  const handleGoBackToLogin = (e: React.MouseEvent) => {
    e.preventDefault(); 
    
    if (typeof onCancel === 'function') {
      onCancel(); // Eğer ana dosya görevini yaptıysa normal şekilde kapat
    } else {
      // Eğer ana dosya onCancel'ı unuttuysa (r is not a function hatası buradaydı), zorla ID ekranına dön!
      window.location.href = window.location.pathname; 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-xl">
      <div className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(57,255,20,0.1)]">
            <ShieldCheck className="text-[#39FF14] w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Güvenlik Kontrolü</h2>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <p className="text-slate-400 text-sm text-center">Lütfen kayıtlı e-posta adresinizi doğrulayın.</p>
            
            <input
              id="student-email"
              name="student-email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-[#39FF14]/50 outline-none transition-all"
              required
            />
            {status === 'error' && <p className="text-red-400 text-xs font-bold text-center">{errorMessage}</p>}
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={handleGoBackToLogin} 
                className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16}/> Geri Dön
              </button>
              <button 
                type="submit" 
                disabled={status === 'sending' || cooldown > 0} 
                className="flex-1 py-3.5 rounded-xl font-bold bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 hover:bg-[#39FF14]/20 disabled:opacity-50"
              >
                {status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : cooldown > 0 ? `${cooldown}s` : 'Kod Gönder'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-1"><b>{email}</b> adresine kod gönderildi.</p>
              {showSpamTip && <p className="text-[#39FF14] text-xs font-medium animate-pulse">Lütfen spam (gereksiz) kutunuzu kontrol edin.</p>}
            </div>

            <input
              id="otp-code"
              name="otp-code"
              autoComplete="one-time-code"
              type="text"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-3xl tracking-[0.4em] font-mono text-white focus:border-[#39FF14]/50 outline-none uppercase"
              required
            />

            {status === 'error' && <p className="text-red-400 text-xs font-bold text-center">{errorMessage}</p>}

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault(); 
                  setStep('email'); 
                  setCode(''); 
                  setShowSpamTip(false); 
                  setStatus('idle');
                }} 
                className="flex-1 py-3.5 rounded-xl font-medium text-slate-400 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16}/> Geri Dön
              </button>
              <button 
                type="submit" 
                disabled={status === 'verifying' || status === 'success'} 
                className="flex-1 py-3.5 rounded-xl font-bold bg-[#39FF14] text-black hover:bg-[#32e011] transition-all"
              >
                {status === 'verifying' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Doğrula'}
              </button>
            </div>

            <div className="text-center pt-2">
              <button 
                type="button" 
                disabled={cooldown > 0}
                onClick={() => setShowSpamTip(true)}
                className={`text-xs font-medium transition-all flex items-center justify-center gap-1 mx-auto ${cooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
              >
                {cooldown > 0 ? <><Clock size={12}/> Kodun gelmesine {cooldown} saniye var</> : <><HelpCircle size={12}/> Kod gelmedi mi?</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};



