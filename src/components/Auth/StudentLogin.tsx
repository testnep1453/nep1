import { useState } from 'react';

export const StudentLogin = ({ onLogin }: { onLogin: (id: string) => Promise<boolean> }) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;
    setLoading(true); setError('');
    const success = await onLogin(studentId);
    if (!success) { setError('SİSTEMDE BU NUMARA BULUNAMADI!'); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2e] via-[#25293c] to-[#1a1d2e] flex flex-col items-center pt-24 p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="flex flex-col items-center justify-center mb-12 animate-pulse-glow">
          <img 
            src="/68b42031492c916cc2c20789_nep_logo%201.png" 
            alt="NEP Logo" 
            className="h-28 object-contain mb-6 brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          />
          <h1 className="text-4xl font-extrabold text-white tracking-widest uppercase">SİSTEM GİRİŞİ</h1>
        </div>
        <form onSubmit={handleSubmit} className="w-full bg-[#2d3142] rounded-3xl p-8 border-2 border-[#6358cc]/40 flex flex-col items-center">
          <input
            name="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
            maxLength={4}
            placeholder="1234"
            className="w-full px-4 py-5 bg-[#1a1d2e] border-2 border-[#6358cc]/50 animate-rgb-border rounded-2xl text-white text-3xl font-black text-center placeholder:text-white/20 focus:outline-none focus:border-[#00cfe8] transition-all"
            disabled={loading}
          />
          {error && <p className="text-[#ff6b6e] text-sm font-bold mt-4 animate-pulse">{error}</p>}
          
          <button
            type="submit"
            disabled={loading || !studentId}
            className="mt-8 text-8xl transition-all duration-300 hover:scale-125 hover:-translate-y-4 active:scale-95 disabled:opacity-50 drop-shadow-[0_0_20px_rgba(255,159,67,0.6)] animate-bounce"
          >
            {loading ? '⏳' : '🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};
