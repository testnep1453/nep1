import { useState } from 'react';
import { signInWithGoogle, sendVerificationLink, saveStudentEmail, mapGoogleUserToStudent, signInAndMapStudent } from '../../services/authService';

interface EmailVerificationModalProps {
  studentId: string;
  studentName: string;
  onVerified: (email: string) => void;
  onSkip?: () => void;
}

export const EmailVerificationModal = ({
  studentId,
  studentName,
  onVerified,
}: EmailVerificationModalProps) => {
  const [mode, setMode] = useState<'choice' | 'manual'>('choice');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkSent, setLinkSent] = useState(false);

  // Google ile hızlı doğrulama
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      if (!result) {
        setError('Google girişi iptal edildi.');
        setLoading(false);
        return;
      }

      // Google e-postasını öğrenciye kaydet
      await saveStudentEmail(studentId, result.email);
      // userMappings'e kaydet
      await mapGoogleUserToStudent(result.user, studentId);

      onVerified(result.email);
    } catch {
      setError('Google girişi sırasında bir hata oluştu.');
    }
    setLoading(false);
  };

  // Manuel e-posta ile doğrulama linki gönder
  const handleSendLink = async () => {
    if (!email || !email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Önce anonymous auth yap
      await signInAndMapStudent(studentId);
      // Sonra doğrulama linki gönder
      const sent = await sendVerificationLink(email, studentId);
      if (sent) {
        setLinkSent(true);
        // E-postayı Firestore'a kaydet
        await saveStudentEmail(studentId, email);
        onVerified(email);
      } else {
        setError('Doğrulama e-postası gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
    setLoading(false);
  };

  // Link gönderildikten sonra
  if (linkSent) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>

        <div className="w-full max-w-md z-10 relative text-center space-y-6">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
            Doğrulama Gönderildi
          </h2>
          <p className="text-gray-400 text-sm">
            <span className="text-[#00F0FF] font-bold">{email}</span> adresine doğrulama gönderildi.
          </p>
          <p className="text-gray-500 text-xs">
            E-postanızı kontrol edin ve doğrulama linkine tıklayın.
            Ardından bu sayfaya geri dönün.
          </p>
          <div className="bg-[#0A1128]/80 border border-[#6358cc]/30 p-4 rounded-lg">
            <p className="text-gray-400 text-xs">
              E-posta gelmediyse spam klasörünü kontrol edin veya
              <button
                onClick={() => { setLinkSent(false); setMode('choice'); }}
                className="text-[#00F0FF] hover:underline ml-1"
              >
                tekrar deneyin
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Manuel e-posta giriş ekranı
  if (mode === 'manual') {
    return (
      <div className="min-h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>

        <div className="w-full max-w-md z-10 relative space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
              E-Posta Doğrulama
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              <span className="text-[#00F0FF] font-bold">{studentName}</span>, e-posta adresini gir.
              Doğrulama linki göndereceğiz.
            </p>
          </div>

          <div className="space-y-4">
            <input
              id="emailVerificationInput"
              name="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="ornek@gmail.com"
              className="w-full px-4 py-4 bg-[#0A1128] border-2 border-[#00F0FF]/30 text-white text-lg rounded-lg focus:border-[#00F0FF] focus:outline-none transition-all placeholder:text-gray-600"
              disabled={loading}
              autoComplete="email"
              autoFocus
            />

            {error && (
              <p className="text-[#FF4500] text-sm font-bold text-center">{error}</p>
            )}

            <button
              onClick={handleSendLink}
              disabled={loading || !email}
              className="w-full bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF] py-4 font-bold transition-all uppercase tracking-widest rounded-lg text-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'GÖNDERİLİYOR...' : 'DOĞRULAMA LİNKİ GÖNDER'}
            </button>

            <button
              onClick={() => setMode('choice')}
              className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
            >
              ← Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ana seçim ekranı
  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
      </div>

      <div className="w-full max-w-md z-10 relative space-y-8">
        {/* Başlık */}
        <div className="text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
            E-Posta Doğrulaması
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Merhaba <span className="text-[#00F0FF] font-bold">{studentName}</span>!
            Güvenliğin için e-posta adresini doğrulamalısın.
          </p>
        </div>

        {/* Google ile Giriş */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 py-4 px-6 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? 'BEKLEYİN...' : 'Google ile Doğrula'}
        </button>

        {/* Ayırıcı */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-xs uppercase tracking-wider">veya</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Manuel Email */}
        <button
          onClick={() => setMode('manual')}
          disabled={loading}
          className="w-full bg-[#0A1128]/80 hover:bg-[#0A1128] text-[#00F0FF] border border-[#00F0FF]/30 hover:border-[#00F0FF] py-4 px-6 rounded-lg font-bold text-base transition-all disabled:opacity-50"
        >
          ✉️ E-posta ile Doğrula
        </button>

        {error && (
          <p className="text-[#FF4500] text-sm font-bold text-center">{error}</p>
        )}

        {/* Bilgi */}
        <div className="bg-[#0A1128]/50 border border-gray-800 p-4 rounded-lg">
          <p className="text-gray-500 text-xs text-center">
            🛡️ E-posta adresin güvende. Sadece hesap doğrulama ve ders bildirimleri için kullanılacak.
          </p>
        </div>
      </div>
    </div>
  );
};
