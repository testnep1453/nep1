import { useState, useEffect, useRef, useCallback } from 'react';
import { getStudents } from '../../services/db';
import { signInWithGoogle, findStudentByEmail, saveStudentEmail, mapGoogleUserToStudent } from '../../services/authService';

interface StudentLoginProps {
  onLogin: (id: string) => Promise<boolean>;
  onLoginWithGoogle?: (id: string, email: string) => Promise<boolean>;
  pendingStudent?: { name: string; id: string } | null;
  needsConfirmation?: boolean;
  onConfirm?: () => void;
  onReject?: () => void;
}

export const StudentLogin = ({
  onLogin,
  onLoginWithGoogle,
  pendingStudent,
  needsConfirmation,
  onConfirm,
  onReject,
}: StudentLoginProps) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholderId, setPlaceholderId] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Cache
  const studentsCacheRef = useRef<{ id: string; name: string; nickname?: string }[] | null>(null);

  const getStudentsCached = () => {
    if (!studentsCacheRef.current) {
      studentsCacheRef.current = getStudents();
    }
    return studentsCacheRef.current;
  };

  // Rate limiting
  const attemptCountRef = useRef(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLockedRef = useRef(false);

  const triggerLogin = useCallback(async (idToSubmit: string) => {
    if (isLockedRef.current) {
      setError('Çok fazla hatalı deneme! Lütfen biraz bekleyin.');
      return;
    }
    setLoading(true);
    setError('');
    const success = await onLogin(idToSubmit);

    if (!success) {
      attemptCountRef.current += 1;

      if (attemptCountRef.current >= 5) {
        isLockedRef.current = true;
        setError('Çok fazla hatalı deneme! 30 saniye bekleyin.');
        lockoutTimerRef.current = setTimeout(() => {
          attemptCountRef.current = 0;
          isLockedRef.current = false;
          setError('');
        }, 30000);
      } else {
        setError('SİSTEMDE BU NUMARA BULUNAMADI!');
      }
      setLoading(false);
    } else {
      attemptCountRef.current = 0;
      setLoading(false);
    }
  }, [onLogin]);

  // Google ile giriş
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      if (!result) {
        setGoogleLoading(false);
        return;
      }

      // Firestore'da bu e-postayla eşleşen öğrenci var mı?
      const matchedStudentId = await findStudentByEmail(result.email);
      if (matchedStudentId) {
        await mapGoogleUserToStudent(result.user, matchedStudentId);
        await saveStudentEmail(matchedStudentId, result.email);
        if (onLoginWithGoogle) {
          await onLoginWithGoogle(matchedStudentId, result.email);
        } else {
          await onLogin(matchedStudentId);
        }
      } else {
        // E-posta eşleşmedi — local JSON'da ara
        const localStudents = getStudentsCached();
        const localMatch = localStudents.find(s => (s as { email?: string }).email === result.email);
        if (localMatch) {
          await mapGoogleUserToStudent(result.user, localMatch.id);
          await saveStudentEmail(localMatch.id, result.email);
          if (onLoginWithGoogle) {
            await onLoginWithGoogle(localMatch.id, result.email);
          } else {
            await onLogin(localMatch.id);
          }
        } else {
          setError('Bu Google hesabı hiçbir ajan ile eşleşmiyor. Önce numaranla giriş yap.');
        }
      }
    } catch {
      setError('Google girişi sırasında hata oluştu.');
    }
    setGoogleLoading(false);
  };

  // Suppress unused variable warning
  void lockoutTimerRef;

  // Otomatik giriş
  useEffect(() => {
    if (studentId.length < 3) {
      setError('');
      return;
    }

    const dbData = getStudentsCached();
    const exactMatch = dbData.find((s) => s.id === studentId);

    if (exactMatch) {
      triggerLogin(studentId);
    } else if (studentId.length === 3) {
      const partialMatch = dbData.find((s) => s.id.startsWith(studentId));
      if (partialMatch) {
        // Kısmi eşleşme tespit edildi — sessiz
      }
    } else if (studentId.length === 4) {
      triggerLogin(studentId);
    }
  }, [studentId, triggerLogin]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && studentId.length >= 3 && studentId.length <= 4) {
      triggerLogin(studentId);
    }
  };

  // Placeholder animasyonu
  useEffect(() => {
    const dbIds = getStudentsCached().map((s) => s.id);

    const generateSafeId = () => {
      let safeId = '';
      let isDuplicate = true;
      while (isDuplicate) {
        const isThreeDigits = Math.random() > 0.5;
        const num = isThreeDigits
          ? Math.floor(Math.random() * 900) + 100
          : Math.floor(Math.random() * 9000) + 1000;
        safeId = num.toString();
        if (!dbIds.includes(safeId)) {
          isDuplicate = false;
        }
      }
      return safeId;
    };

    let typingTimer: ReturnType<typeof setTimeout>;

    const runPlaceholderCycle = () => {
      if (studentId || loading || needsConfirmation) return;

      const newId = generateSafeId();
      let currentStr = '';
      let charIdx = 0;

      const typeChar = () => {
        if (studentId || loading || needsConfirmation) return;
        currentStr += newId[charIdx];
        setPlaceholderId(currentStr);
        charIdx++;

        if (charIdx < newId.length) {
          typingTimer = setTimeout(typeChar, 180 + Math.random() * 200);
        } else {
          typingTimer = setTimeout(() => {
            setPlaceholderId('');
            typingTimer = setTimeout(runPlaceholderCycle, 400);
          }, 1500);
        }
      };

      typeChar();
    };

    typingTimer = setTimeout(runPlaceholderCycle, 500);
    return () => clearTimeout(typingTimer);
  }, [studentId, loading, needsConfirmation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId) {
      triggerLogin(studentId);
    }
  };

  // İsim Doğrulama Görünümü
  if (needsConfirmation && pendingStudent) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>

        <div className="w-full max-w-sm z-10 relative text-center">
          <div className="text-6xl mb-6">🛡️</div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 uppercase tracking-wider">
            KİMLİK DOĞRULAMA
          </h2>

          <p className="text-gray-400 text-sm mb-8">
            Sen{' '}
            <span className="text-[#00F0FF] font-bold text-lg">
              {pendingStudent.name}
            </span>{' '}
            mısın?
          </p>

          <div className="flex gap-4">
            <button
              id="confirmIdentityBtn"
              onClick={onConfirm}
              className="flex-1 bg-[#39FF14]/20 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14] py-4 font-bold transition-all uppercase tracking-widest rounded-lg text-lg min-h-[56px]"
            >
              EVET, BENİM
            </button>
            <button
              id="rejectIdentityBtn"
              onClick={() => {
                onReject?.();
                setStudentId('');
                setLoading(false);
              }}
              className="flex-1 bg-[#FF4500]/20 hover:bg-[#FF4500] text-[#FF4500] hover:text-black border border-[#FF4500] py-4 font-bold transition-all uppercase tracking-widest rounded-lg text-lg min-h-[56px]"
            >
              HAYIR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center justify-center z-10 relative">
        {/* Logo */}
        <img
          src={`${import.meta.env.BASE_URL}nep-logo.png`}
          alt="NEP Logo"
          className="h-24 sm:h-28 object-contain mb-8 brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
        />

        {/* Başlık */}
        <div className="mb-10 sm:mb-12 inline-block">
          <h2 className="text-lg sm:text-xl font-medium text-[#39FF14] tracking-[0.3em] uppercase overflow-hidden whitespace-nowrap animate-typing border-r-2 border-[#39FF14]">
            SİSTEM GİRİŞİ
          </h2>
        </div>

        {/* Form — Sayısal ID */}
        <form id="loginForm" onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <input
            id="studentIdInput"
            name="studentId"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            maxLength={4}
            placeholder={loading ? 'BEKLEYİN...' : placeholderId}
            className={`w-full px-2 py-4 bg-transparent border-b-2 ${
              error
                ? 'border-[#ff6b6e] text-[#ff6b6e]'
                : 'border-[#39FF14]/50 text-white focus:border-[#39FF14]'
            } text-4xl sm:text-5xl font-black tracking-[0.4em] text-center placeholder:text-white/20 focus:outline-none transition-all`}
            disabled={loading || googleLoading}
            autoComplete="off"
          />

          <div className={`mt-6 transition-all duration-300 ${error ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <p className="text-[#ff6b6e] text-sm font-bold tracking-widest uppercase text-center">
              {error}
            </p>
          </div>
        </form>

        {/* Ayırıcı */}
        <div className="flex items-center gap-4 w-full mt-10 mb-6">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-600 text-xs uppercase tracking-wider">veya</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Google ile Giriş Butonu */}
        <button
          id="googleLoginBtn"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 py-3.5 px-6 rounded-lg font-medium text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'BEKLEYİN...' : 'Google ile Giriş Yap'}
        </button>

        <p className="text-gray-600 text-[10px] mt-4 text-center">
          Google ile giriş yapabilmek için e-postan sisteme kayıtlı olmalı.
        </p>
      </div>
    </div>
  );
};
