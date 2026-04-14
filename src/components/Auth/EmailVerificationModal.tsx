import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft, Clock } from 'lucide-react';
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
  
  // SPAM KORUMASI: Geri sayım sayacı
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
    if (!email || cooldown > 0) return; // Süre bitmeden tekrar basılamaz!
    
    setStatus('sending');
    
    // Yeni authService fonksiyonu obje dönüyor: { success, message }
    const result = await sendVerificationCode(email);
    
    if (result.success) {
      setStatus('idle');
      setStep('code');
      setErrorMessage('');
      setCooldown(60); // 60 saniye kilit!
    } else {
      setStatus('error');
      // authService'den gelen özel hata mesajını (örn: "Kayıtlı değil!") gösteriyoruz
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Mail className="text-blue-400 w-6 h-6" />
          Kimlik Doğrulama
        </h2>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-5">
            <p className="text-slate-300 leading-relaxed">
              Güvenliğiniz için lütfen sisteme kayıtlı e-posta adresinizi girin. Size bir onay kodu göndereceğiz.
            </p>
            <input
              id="email-input"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
            {status === 'error' && <p className="text-red-400 text-sm font-bold">{errorMessage}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => window.location.reload()} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"> 
                Geri Dön
              </button>
              <button type="submit" disabled={status === 'sending' || cooldown > 0} className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 ${cooldown > 0 ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}>
                {status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : cooldown > 0 ? <><Clock className="w-4 h-4"/> {cooldown} sn</> : 'Kod Gönder'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <p className="text-slate-300 leading-relaxed">
              <b>{email}</b> adresine bir kod gönderdik. Lütfen aşağıya girin.
            </p>
            <input
              id="code-input"
              name="code"
              type="text"
              maxLength={8}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
              placeholder="KODU GİRİN"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.2em] font-mono text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
              required
            />
            {status === 'error' && <p className="text-red-400 text-sm flex items-center gap-1"><XCircle className="w-4 h-4"/> {errorMessage}</p>}
            {status === 'success' && <p className="text-green-400 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Doğrulandı! Giriş yapılıyor...</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => {setStep('email'); setCode(''); setStatus('idle');}} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">Geri</button>
              <button type="submit" disabled={status === 'verifying' || status === 'success'} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                {status === 'verifying' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Doğrula'}
              </button>
            </div>
            
            {/* SPAM KORUMASI: Tekrar kod gönderme butonu */}
            <div className="text-center pt-2">
              <button type="button" onClick={handleSendCode} disabled={cooldown > 0 || status === 'sending'} className={`text-sm font-semibold transition-colors ${cooldown > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}>
                {cooldown > 0 ? `Yeni kod iste (${cooldown} sn)` : 'Kodu tekrar gönder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
