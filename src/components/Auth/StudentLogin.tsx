import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';

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
      setError('OYUNCU BULUNAMADI! ID\'NİZİ KONTROL EDİN');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2e] via-[#25293c] to-[#1a1d2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-pulse-glow">
          <Gamepad2 className="w-20 h-20 mx-auto mb-4 text-[#6358cc]" strokeWidth={2} />
          <h1 className="text-5xl font-bold text-white mb-2 tracking-wider uppercase">
            NEP GAMING
          </h1>
          <p className="text-[#00cfe8] text-xl font-semibold">EĞITIM MERKEZI</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#2d3142] rounded-2xl p-8 shadow-2xl border-2 border-[#6358cc]/30">
          <div className="mb-6">
            <label className="block text-white text-sm font-bold mb-2 uppercase tracking-wide">
              OYUNCU ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              placeholder="1234"
              className="w-full px-4 py-4 bg-[#1a1d2e] border-2 border-[#6358cc] rounded-xl text-white text-2xl font-bold text-center focus:outline-none focus:ring-4 focus:ring-[#6358cc]/50 transition-all"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#d44d4e]/20 border-2 border-[#d44d4e] rounded-lg">
              <p className="text-[#d44d4e] text-sm font-bold text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !studentId}
            className="w-full bg-gradient-to-r from-[#6358cc] to-[#8b7fd8] text-white font-bold py-4 px-6 rounded-xl uppercase tracking-wider text-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#6358cc]/50"
          >
            {loading ? 'BAĞLANILIYOR...' : '🚀 OYUNA GİR'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[#cfcce4]/60 text-sm">
            ID'nizi bilmiyorsanız öğretmeninize sorun
          </p>
        </div>
      </div>
    </div>
  );
};
