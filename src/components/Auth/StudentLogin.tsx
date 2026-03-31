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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2e] via-[#25293c] to-[#1a1d2e] flex flex-col items-center pt-24 p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* LOGO VE BAŞLIK */}
        <div className="flex flex-col items-center justify-center mb-8 w-full animate-pulse-glow">
          <img 
            src="/68b42031492c916cc2c20789_nep_logo%201.png" 
            alt="NEP Logo" 
            className="h-24 md:h-28 object-contain mb-6 brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-transform hover:scale-105"
          />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-widest uppercase text-center drop-shadow-md">
            SİSTEM GİRİŞİ
          </h1>
        </div>

        {/* FORM BÖLÜMÜ */}
        <form onSubmit={handleSubmit} className="w-full bg-[#2d3142] rounded-3xl p-8 shadow-[0_0_40px_rgba(99,88,204,0.15)] border-2 border-[#6358cc]/40 flex flex-col items-center">
          <div className="w-full mb-10">
            <label htmlFor="studentIdInput" className="block text-white/80 text-sm font-bold mb-4 uppercase tracking-widest text-center">
              NEP ÖĞRENCİ NUMARASI
            </label>
            <input
              id="studentIdInput"
              name="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              placeholder="1234"
              className="w-full px-4 py-5 bg-[#1a1d2e] border-2 border-[#6358cc]/50 animate-rgb-border rounded-2xl text-white text-3xl font-black tracking-widest text-center placeholder:text-white/20 focus:outline-none focus:border-[#00cfe8] focus:shadow-[0_0_20px_rgba(0,207,232,0.3)] transition-all"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="w-full mb-6 p-4 bg-[#d44d4e]/10 border border-[#d44d4e]/50 rounded-xl animate-pulse">
              <p className="text-[#ff6b6e] text-sm font-bold text-center tracking-wide">{error}</p>
            </div>
          )}

          {/* SADECE ROKET (Arka plan yok, devasa emoji) */}
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
