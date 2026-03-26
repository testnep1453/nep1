import { useState, useEffect } from 'react';

interface StudentLoginProps {
  onLogin: (studentId: string) => Promise<boolean>;
}

export const StudentLogin = ({ onLogin }: StudentLoginProps) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholder, setPlaceholder] = useState('');

  // Rastgele Öğrenci Numarası Yazma Animasyonu
  useEffect(() => {
    let isDeleting = false;
    let text = '';
    let targetNumber = generateRandomId();
    let timer: NodeJS.Timeout;

    // Asla gerçek öğrenci numarası (1001, 1002 vb.) üretmeyecek fonksiyon
    function generateRandomId() {
      let num;
      do {
        num = Math.floor(Math.random() * 9000) + 1000;
      } while (num === 1001 || num === 1002); // Gerçek numaraları buraya ekleyebilirsin
      return num.toString();
    }

    const tick = () => {
      if (!isDeleting) {
        text = targetNumber.substring(0, text.length + 1);
        setPlaceholder(text);
        if (text === targetNumber) {
          isDeleting = true;
          timer = setTimeout(tick, 2000); // Numarayı yazdıktan sonra 2 saniye bekle
          return;
        }
      } else {
        text = targetNumber.substring(0, text.length - 1);
        setPlaceholder(text);
        if (text === '') {
          isDeleting = false;
          targetNumber = generateRandomId();
          timer = setTimeout(tick, 500); // Silince yenisine başlamadan önce yarım saniye bekle
          return;
        }
      }
      // Yazma hızı (150ms) ve Silme hızı (100ms)
      timer = setTimeout(tick, isDeleting ? 100 : 150);
    };

    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    setLoading(true);
    setError('');

    const success = await onLogin(studentId);

    if (!success) {
      setError('ÖĞRENCİ BULUNAMADI! NUMARANIZI KONTROL EDİN');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2e] via-[#25293c] to-[#1a1d2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-pulse-glow">
          {/* Orijinal NEP Logosu */}
          <img 
            src="https://cdn.prod.website-files.com/68b41d250349c9a385b11ecc/68b42031492c916cc2c20789_nep_logo%201.png" 
            alt="NEP Logo" 
            className="h-28 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(99,88,204,0.6)] filter brightness-0 invert opacity-95 transition-all hover:scale-105"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-wider uppercase">
            NEP DERS PANELİ
          </h1>
          <p className="text-[#00cfe8] text-xl font-semibold tracking-widest">SİSTEM GİRİŞİ</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#2d3142] rounded-2xl p-8 shadow-2xl border-2 border-[#6358cc]/30">
          <div className="mb-8">
            <label className="block text-white text-sm font-bold mb-4 uppercase tracking-widest text-center">
              NEP ÖĞRENCİ NUMARASI
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              placeholder={placeholder}
              className="w-full px-4 py-4 bg-[#1a1d2e] border-2 border-[#6358cc] rounded-xl text-white text-3xl font-bold text-center focus:outline-none focus:ring-4 focus:ring-[#6358cc]/50 transition-all placeholder:text-gray-600"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#d44d4e]/20 border-2 border-[#d44d4e] rounded-lg">
              <p className="text-[#d44d4e] text-sm font-bold text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !studentId}
            className="w-full bg-gradient-to-r from-[#6358cc] to-[#8b7fd8] text-white font-bold py-4 px-6 rounded-xl uppercase tracking-wider text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#6358cc]/50"
          >
            {loading ? 'BAĞLANILIYOR...' : '🚀 SİSTEME GİRİŞ YAP'}
          </button>
        </form>
      </div>
    </div>
  );
};
