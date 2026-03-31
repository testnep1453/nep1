import { useState, useEffect } from 'react';
// Gerçek öğrenci veritabanını içe aktarıyoruz
import studentData from '../../student_list.json';

export const StudentLogin = ({ onLogin }: { onLogin: (id: string) => Promise<boolean> }) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholderId, setPlaceholderId] = useState('---');

  // Ortak Giriş Fonksiyonu
  const triggerLogin = async (idToSubmit: string) => {
    setLoading(true);
    setError('');
    const success = await onLogin(idToSubmit);
    
    if (!success) {
      setError('SİSTEMDE BU NUMARA BULUNAMADI!');
      setLoading(false);
      setStudentId(''); // Hatalıysa içini temizle ki tekrar yazabilsin
    }
  };

  // 4 Haneye Ulaşınca Otomatik Giriş
  useEffect(() => {
    if (studentId.length === 4) {
      triggerLogin(studentId);
    } else if (studentId.length < 4) {
      setError('');
    }
  }, [studentId]);

  // 3 Haneli Numaralar İçin 'Enter' Tuşuyla Giriş Yapma Desteği
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && studentId.length >= 3 && studentId.length <= 4) {
      triggerLogin(studentId);
    }
  };

  // Veritabanı ile Çakışmayan Rastgele Sayı Döngüsü
  useEffect(() => {
    // Mevcut öğrenci ID'lerini bir diziye alıyoruz
    const dbIds = studentData.map((s: { id: string }) => s.id);
    
    const generateSafeId = () => {
      let safeId = '';
      let isDuplicate = true;
      
      // Üretilen sayı veritabanında olduğu sürece yeniden üret
      while (isDuplicate) {
        // %50 ihtimalle 3 haneli, %50 ihtimalle 4 haneli
        const isThreeDigits = Math.random() > 0.5;
        const num = isThreeDigits 
          ? Math.floor(Math.random() * 900) + 100   // 100 - 999 arası
          : Math.floor(Math.random() * 9000) + 1000; // 1000 - 9999 arası
          
        safeId = num.toString();
        
        // Eğer veritabanında YOKSA döngüden çık
        if (!dbIds.includes(safeId)) {
          isDuplicate = false;
        }
      }
      return safeId;
    };

    const interval = setInterval(() => {
      // Sadece kullanıcı bir şey yazmıyorsa ve giriş yapılmıyorsa sayıyı değiştir
      if (!studentId && !loading) {
        setPlaceholderId(generateSafeId());
      }
    }, 2000); // Her 2 saniyede bir değişir

    return () => clearInterval(interval);
  }, [studentId, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2e] via-[#25293c] to-[#1a1d2e] flex flex-col items-center pt-24 p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* Logo ve Yazı Ayrımı - Hiyerarşi Sağlandı */}
        <div className="flex flex-col items-center justify-center mb-16">
          <img 
            src={`${import.meta.env.BASE_URL}nep-logo.png`}  
            alt="NEP Logo" 
            className="h-32 object-contain mb-6 brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          />
          <div className="inline-block">
            {/* Önceden h1'di, şimdi daha zarif, ince ve gri bir alt başlık oldu */}
            <h2 className="text-xl font-medium text-gray-400 tracking-[0.3em] uppercase animate-typing">
              SİSTEM GİRİŞİ
            </h2>
          </div>
        </div>

        {/* Form Alanı */}
        <div className="w-full flex flex-col items-center">
          <input
            name="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            maxLength={4}
            placeholder={loading ? "GİRİŞ YAPILIYOR..." : placeholderId}
            /* animate-rgb-border sınıfını buraya ekledik (hata yoksa rgb döner) */
            className={`w-full max-w-[250px] px-4 py-5 bg-[#1a1d2e]/80 border-b-4 ${error ? 'border-[#ff6b6e]' : 'animate-rgb-border'} rounded-xl text-white text-4xl font-black text-center placeholder:text-white/20 focus:outline-none focus:shadow-[0_0_30px_rgba(0,207,232,0.3)] transition-all disabled:opacity-50`}
            disabled={loading}
            autoFocus
          />
          
          {/* Hata Mesajı */}
          {error && (
            <p className="text-[#ff6b6e] text-sm font-bold mt-6 animate-pulse tracking-wider">
              {error}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
