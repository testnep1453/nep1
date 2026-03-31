import { useState, useEffect } from 'react';
import { getStudentsFromFirebase } from '../../services/dbFirebase';

export const StudentLogin = ({ onLogin }: { onLogin: (id: string) => Promise<boolean> }) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholderId, setPlaceholderId] = useState('---');
  const [dbData, setDbData] = useState<any[]>([]);

  useEffect(() => {
    getStudentsFromFirebase().then(setDbData);
  }, []);

  // Ortak Giriş Fonksiyonu
  const triggerLogin = async (idToSubmit: string) => {
    setLoading(true);
    setError('');
    const success = await onLogin(idToSubmit);
    
    if (!success) {
      setError('SİSTEMDE BU NUMARA BULUNAMADI!');
      setLoading(false);
    }
  };

  // 4 Haneye Veya Eşleşen 3 Haneye Ulaşınca Otomatik Giriş
  useEffect(() => {
    if (studentId.length >= 3) {
      const exactMatch = dbData.find((s) => s.id === studentId);
      if (exactMatch) {
         triggerLogin(studentId);
      } else if (studentId.length === 3) {
         const partialMatch = dbData.find((s) => s.id.startsWith(studentId));
         if (partialMatch) {
            console.log(`[BİLDİRİM - ADMİN 1002]: ${studentId} ile başlayan şüpheli/kısmi giriş!`);
         }
      } else if (studentId.length === 4) {
         triggerLogin(studentId);
      }
    } else {
      setError('');
    }
  }, [studentId]);

  // 'Enter' Tuşuyla Giriş Yapma Desteği
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && studentId.length >= 3 && studentId.length <= 4) {
      triggerLogin(studentId);
    }
  };

  // Veritabanı ile Çakışmayan Rastgele Sayı Döngüsü
  useEffect(() => {
    const dbIds = dbData.map((s) => s.id);
    
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

    const interval = setInterval(() => {
      if (!studentId && !loading) {
        setPlaceholderId(generateSafeId());
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [studentId, loading, dbData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId) {
      triggerLogin(studentId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2e] via-[#25293c] to-[#1a1d2e] flex flex-col items-center pt-24 p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* Logo ve Yazı Ayrımı */}
        <div className="flex flex-col items-center justify-center mb-16">
          <img 
            src={`${import.meta.env.BASE_URL}nep-logo.png`}  
            alt="NEP Logo" 
            className="h-32 object-contain mb-6 brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          />
          <div className="inline-block">
            <h2 className="text-xl font-medium text-gray-400 tracking-[0.3em] uppercase animate-typing">
              SİSTEM GİRİŞİ
            </h2>
          </div>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleSubmit} className="w-full bg-[#2d3142] rounded-3xl p-8 shadow-[0_0_40px_rgba(99,88,204,0.15)] border-2 border-[#6358cc]/40 flex flex-col items-center">
          <div className="w-full mb-10 relative">
            <label htmlFor="studentIdInput" className="block text-white/80 text-sm font-bold mb-4 uppercase tracking-widest text-center">
              NEP ÖĞRENCİ NUMARASI VEYA KODU
            </label>
            <input
              id="studentIdInput"
              name="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              maxLength={4}
              placeholder={loading ? "GİRİŞ YAPILIYOR..." : placeholderId}
              className={`w-full px-4 py-5 bg-[#1a1d2e] border-2 ${error ? 'border-[#ff6b6e]' : 'border-[#6358cc]/50 animate-rgb-border'} rounded-2xl text-white text-3xl font-black tracking-widest text-center placeholder:text-white/20 focus:outline-none focus:border-[#00cfe8] focus:shadow-[0_0_20px_rgba(0,207,232,0.3)] transition-all`}
            />
          </div>

          <div className={`w-full mb-6 p-4 rounded-xl transition-all duration-300 ${error ? 'bg-[#d44d4e]/10 border border-[#d44d4e]/50 opacity-100' : 'opacity-0 h-0 p-0 overflow-hidden'}`}>
            <p className="text-[#ff6b6e] text-lg font-bold text-center tracking-wide typing-effect overflow-hidden whitespace-nowrap">{error}</p>
          </div>

          {/* SADECE ROKET */}
          <button
            type="submit"
            disabled={loading || !studentId}
            className="text-7xl transition-all duration-300 hover:scale-125 hover:-translate-y-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed drop-shadow-[0_0_15px_rgba(255,159,67,0.6)] animate-bounce"
            aria-label="Sisteme Gir"
          >
            {loading ? '⏳' : '🚀'}
          </button>
          <p className="mt-2 text-white/30 text-xs uppercase tracking-widest font-bold">Fırlatmak için tıkla</p>
        </form>

      </div>
    </div>
  );
};
