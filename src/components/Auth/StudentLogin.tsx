import { useState, useEffect } from 'react';

export const StudentLogin = ({ onLogin }: { onLogin: (id: string) => Promise<boolean> }) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gerçek zamanlı kontrol: Numara 4 haneye ulaştığında otomatik tetiklenir
  useEffect(() => {
    const checkLogin = async () => {
      if (studentId.length === 4) {
        setLoading(true);
        setError('');
        const success = await onLogin(studentId);
        
        if (!success) {
          setError('SİSTEMDE BU NUMARA BULUNAMADI!');
          setLoading(false);
          setStudentId(''); // Hatalıysa içini temizle ki tekrar yazabilsin
        }
      } else {
        // 4 haneden azsa hatayı ekrandan kaldır
        setError('');
      }
    };

    checkLogin();
  }, [studentId, onLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2e] via-[#25293c] to-[#1a1d2e] flex flex-col items-center pt-24 p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* Logo ve Yazma Animasyonlu Başlık */}
        <div className="flex flex-col items-center justify-center mb-16">
          <img 
            src={`${import.meta.env.BASE_URL}nep-logo.png`}  
            alt="NEP Logo" 
            className="h-28 object-contain mb-8 brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          />
          {/* Yazma animasyonunu buraya ekledik */}
          <div className="inline-block">
            <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase animate-typing">
              SİSTEM GİRİŞİ
            </h1>
          </div>
        </div>

        {/* Form Alanı - Dış kutu tamamen kaldırıldı, sadece input var */}
        <div className="w-full flex flex-col items-center">
          <input
            name="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            maxLength={4}
            placeholder={loading ? "GİRİŞ YAPILIYOR..." : "1234"}
            className={`w-full max-w-[250px] px-4 py-5 bg-[#1a1d2e]/80 border-b-4 ${error ? 'border-[#ff6b6e]' : 'border-[#00cfe8]'} rounded-xl text-white text-4xl font-black text-center placeholder:text-white/20 focus:outline-none focus:shadow-[0_0_30px_rgba(0,207,232,0.3)] transition-all disabled:opacity-50`}
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
