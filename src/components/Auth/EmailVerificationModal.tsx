import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { sendVerificationCode, verifyEmailCode } from '../../services/authService';

interface Props {
  studentId: string;
  onVerified: (email: string) => void;
  onCancel: () => void;
}

export const EmailVerificationModal: React.FC<Props> = ({ studentId, onVerified, onCancel }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [status, setStatus] = useState<'idle' | 'sending' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [cooldown, setCooldown] = useState(0);

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
      setCooldown(60); 
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'Şu an işlem yapılamıyor. Lütfen tekrar deneyin.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setStatus('error');
      setErrorMessage('Lütfen kodu eksiksiz girin.');
      return;
    }
    setStatus('verifying');
    const success = await verifyEmailCode(email, code);
    if (success) {
      setStatus('success');
      setTimeout(() => onVerified(email), 1000);
    } else {
      setStatus('error');
      setErrorMessage('Hatalı kod. Lütfen kontrol edip tekrar deneyin.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/90 backdrop-blur-md overflow-hidden">
      
      {/* Arka plan siber ızgara efekti */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
      </div>

      <div className="bg-white/[0.03] border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(0,0,0,0.8)] relative z-10 backdrop-blur-xl">
        
        {/* Üst Kısım Başlık */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(57,255,20,0.15)]">
            <ShieldCheck className="text-[#39FF14] w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-[0.1em] uppercase text-center">
            Sistem Doğrulama
          </h2>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Kimliğinizi doğrulamak için sisteme kayıtlı e-posta adresinizi girin.
              </p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="email-input"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition-all"
                required
              />
            </div>

            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {/* GERİ DÖN BUTONU SAYFAYI YENİLEYECEK ŞEKİLDE DÜZELTİLDİ */}
              <button 
                type="button" 
                onClick={() => window.location.reload()} 
                className="flex-1 px-4 py-3.5 rounded-xl font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2"
              > 
                <ArrowLeft className="w-4 h-4" />
                İptal
              </button>
              <button 
                type="submit" 
                disabled={status === 'sending' || cooldown > 0} 
                className={`flex-1 px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 
                  ${cooldown > 0 || status === 'sending' 
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                    : 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/40 hover:bg-[#39FF14]/20 hover:shadow-[0_0_15px_rgba(57,255,20,0.2)]'
                  }`}
              >
                {status === 'sending' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : cooldown > 0 ? (
                  <><Clock className="w-4 h-4"/> {cooldown} sn</>
                ) : (
                  'Kod Gönder'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm leading-relaxed mb-2">
                <span className="text-[#39FF14] font-medium">{email}</span> adresine bir kod gönderdik.
              </p>
              <p className="text-slate-500 text-xs">Lütfen gelen 6 haneli kodu aşağıya girin.</p>
            </div>

            <input
              id="code-input"
              name="code"
              type="text"
              maxLength={8}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
              placeholder="••••••"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.4em] font-mono text-white placeholder-slate-700 focus:border-[#39FF14]/50 focus:ring-1 focus:ring-[#39FF14]/50 outline-none transition-all uppercase"
              required
            />

            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-lg p-3 flex items-center justify-center gap-2 text-[#39FF14] text-sm">
                <CheckCircle className="w-5 h-5" />
                <p className="font-bold tracking-wide">DOĞRULANDI!</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => {setStep('email'); setCode(''); setStatus('idle');}} 
                className="flex-1 px-4 py-3.5 rounded-xl font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              >
                Geri Dön
              </button>
              <button 
                type="submit" 
                disabled={status === 'verifying' || status === 'success'} 
                className="flex-1 px-4 py-3.5 rounded-xl font-bold text-[#050505] bg-[#39FF14] hover:bg-[#32e011] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all flex items-center justify-center gap-2"
              >
                {status === 'verifying' ? <Loader2 className="w-5 h-5 animate-spin text-[#050505]" /> : 'Giriş Yap'}
              </button>
            </div>
            
            <div className="text-center pt-4 border-t border-white/5">
              <button 
                type="button" 
                onClick={handleSendCode} 
                disabled={cooldown > 0 || status === 'sending'} 
                className={`text-sm font-medium transition-colors ${cooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-[#39FF14] hover:text-[#39FF14]/80 underline underline-offset-4'}`}
              >
                {cooldown > 0 ? `Yeni kod iste (${cooldown} sn)` : 'Kodu tekrar gönder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
