import { useState, useEffect, useRef, useCallback } from 'react';
import { getStudents } from '../../services/db';

export const StudentLogin = ({ onLogin }: { onLogin: (id: string) => Promise<boolean> }) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholderId, setPlaceholderId] = useState('');

  // PERFORMANS DÜZELTMESİ: localStorage okumasını bir kez yap, cache'le
  const studentsCacheRef = useRef<{ id: string; name: string; nickname?: string }[] | null>(null);

  const getStudentsCached = () => {
    if (!studentsCacheRef.current) {
      studentsCacheRef.current = getStudents();
    }
    return studentsCacheRef.current;
  };

  // GÜVENLİK DÜZELTMESİ: Başarısız deneme sayaç + rate limiting
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
    }
  }, [onLogin]);

  // Otomatik giriş — cache'lenmiş veri ile
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
        console.log(`[BİLDİRİM]: ${studentId} ile başlayan kısmi giriş denemesi.`);
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

  // Tak-tak yazma efektli rastgele numara üreticisi
  useEffect(() => {
    const dbIds = getStudents().map((s) => s.id);

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
      if (studentId || loading) return;

      const newId = generateSafeId();
      let currentStr = "";
      let charIdx = 0;

      const typeChar = () => {
        if (studentId || loading) return;
        currentStr += newId[charIdx];
        setPlaceholderId(currentStr);
        charIdx++;
        
        if (charIdx < newId.length) {
          // Her rakam arasında hafif değişken rastgele bir gecikme
          typingTimer = setTimeout(typeChar, 180 + Math.random() * 200);
        } else {
          // Bittiğinde bekle, sonra silip baştan başla
          typingTimer = setTimeout(() => {
            setPlaceholderId("");
            typingTimer = setTimeout(runPlaceholderCycle, 400);
          }, 1500);
        }
      };

      typeChar();
    };

    typingTimer = setTimeout(runPlaceholderCycle, 500);
    return () => clearTimeout(typingTimer);
  }, [studentId, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId) {
      triggerLogin(studentId);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center justify-center z-10 relative">
        
        {/* Sadece NEP Logosu */}
        <img 
          src={`${import.meta.env.BASE_URL}nep-logo.png`}  
          alt="NEP Logo" 
          className="h-28 object-contain mb-8 brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
        />
        
        {/* Sistem Girişi (Yazma efekti var) */}
        <div className="mb-12 inline-block">
          <h2 className="text-xl font-medium text-[#39FF14] tracking-[0.3em] uppercase overflow-hidden whitespace-nowrap animate-typing border-r-2 border-[#39FF14]">
            SİSTEM GİRİŞİ
          </h2>
        </div>

        {/* Form Alanı (Kutussuz Sadece Input) */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <input
            id="studentIdInput"
            name="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            maxLength={4}
            placeholder={loading ? "BEKLEYİN..." : placeholderId}
            className={`w-full px-2 py-4 bg-transparent border-b-2 ${error ? 'border-[#ff6b6e] text-[#ff6b6e]' : 'border-[#39FF14]/50 text-white focus:border-[#39FF14]'} text-5xl font-black tracking-[0.4em] text-center placeholder:text-white/20 focus:outline-none transition-all`}
            disabled={loading}
          />

          <div className={`mt-6 transition-all duration-300 ${error ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <p className="text-[#ff6b6e] text-sm font-bold tracking-widest uppercase text-center">{error}</p>
          </div>
        </form>

      </div>
    </div>
  );
};
