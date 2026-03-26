import { useState } from 'react';

interface StudentLoginProps {
  onLogin: (studentId: string) => Promise<boolean>;
}

export const StudentLogin = ({ onLogin }: StudentLoginProps) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    setLoading(true);
    setError('');

    const success = await onLogin(studentId);

    if (!success) {
      setError('SİSTEMDE BU NUMARA BULUNAMADI!');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2e] via-[#25293c] to-[#1a1d2e] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* LOGO VE BAŞLIK BÖLÜMÜ (Oyun Kolu Yerine Fütüristik Metin Logo) */}
        <div className="flex flex-col items-center justify-center mb-8 w-full animate-pulse-glow">
          
          {/* FÜTÜRİSTİK METİN LOGO (Beyazımsı ve Efektli) */}
          <div className="mb-6 flex items-center justify-center">
            <h1 className="text-8xl font-black text-white/90 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all">
              <span className="text-[#00cfe8]">N</span>EP
            </h1>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-widest uppercase text-center drop-shadow-md">
            SİSTEM GİRİŞİ
          </h1>
        </div>

        {/* FORMU BARINDIRAN BÖLÜM */}
        <form onSubmit={handleSubmit} className="w-full bg-[#2d3142] rounded-3xl p-8 shadow-[0_0_40px_rgba(99,88,204,0.15)] border-2 border-[#6358cc]/40 flex flex-col items-center">
          <div className="w-full mb-8">
            <label className="block text-white/80 text-sm font-bold mb-4 uppercase tracking-widest text-center">
              NEP ÖĞRENCİ NUMARASI
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              placeholder="1234"
              className="w-full px-4 py-5 bg-[#1a1d2e] border-2 border-[#6358cc]/50 rounded-2xl text-white text-3xl font-black tracking-widest text-center placeholder:text-white/20 focus:outline-none focus:border-[#00cfe8] focus:shadow-[0_0_20px_rgba(0,207,232,0.3)] transition-all"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="w-full mb-6 p-4 bg-[#d44d4e]/10 border border-[#d44d4e]/50 rounded-xl animate-pulse">
              <p className="text-[#ff6b6e] text-sm font-bold text-center tracking-wide">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !studentId}
            className="w-full bg-gradient-to-r from-[#6358cc] to-[#8b7fd8] text-white font-black py-5 rounded-2xl uppercase tracking-widest text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,88,204,0.4)]"
          >
            {loading ? 'BAĞLANILIYOR...' : 'SİSTEME GİR'}
          </button>
        </form>

      </div>
    </div>
  );
};
