import { Student } from '../../types/student';

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000, 25000];
const BADGE_CONFIG = [
  { id: 'first_login', label: 'İlk Giriş', emoji: '🎖️', desc: 'Sisteme ilk giriş yaptın!' },
  { id: 'streak_7', label: '1 Hafta', emoji: '🔥', desc: 'Art arda 7 gün boyunca üsse giriş yap.' },
  { id: 'quiz_master', label: 'Quiz Ustası', emoji: '🧠', desc: 'Bir quizi tam puan ile bitir.' },
  { id: 'perfect', label: 'Mükemmel', emoji: '💯', desc: 'Derste tam katılım göster.' },
  { id: 'fast', label: 'Hızlı', emoji: '⚡', desc: 'Derse ilk 1 dakikada katıl.' },
  { id: 'team', label: 'Takım', emoji: '💛', desc: 'Takım çalışmasında öne çık.' },
];

export const LevelProgress = ({ student }: { student: Student }) => {
  const currentLevel = student.level || 1;
  const currentXP = student.xp || 0;
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = Math.min(((currentXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Level Card */}
      <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-6 rounded-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#00F0FF]/10 border-2 border-[#00F0FF]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <span className="text-2xl font-bold text-[#00F0FF]">{currentLevel}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Level {currentLevel}</h3>
            <p className="text-gray-400 text-sm font-mono">{currentXP} / {nextThreshold} XP</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>LEVEL İLERLEMESİ</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-[#050505] rounded-full overflow-hidden border border-gray-800">
            <div className="h-full bg-gradient-to-r from-[#00F0FF] to-[#6358cc] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,240,255,0.5)]"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
        <p className="text-gray-600 text-xs text-center mt-2">
          Sonraki level için {nextThreshold - currentXP} XP daha gerekli
        </p>
      </div>

      {/* Level Yol Haritası */}
      <div className="bg-[#0A1128]/80 border border-[#6358cc]/30 p-6 rounded-lg">
        <h3 className="text-[#8b7fd8] font-bold text-sm uppercase tracking-wider mb-4">📊 Level Yol Haritası</h3>
        <div className="space-y-2">
          {LEVEL_THRESHOLDS.slice(0, 10).map((threshold, idx) => {
            const lvl = idx + 1;
            const isCurrentOrBelow = lvl <= currentLevel;
            const isCurrent = lvl === currentLevel;
            return (
              <div key={lvl} className={`flex items-center gap-3 p-2 rounded ${isCurrent ? 'bg-[#00F0FF]/10 border border-[#00F0FF]/30' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCurrentOrBelow ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-gray-800 text-gray-600'
                }`}>{lvl}</div>
                <div className="flex-1">
                  <div className={`text-sm ${isCurrentOrBelow ? 'text-white' : 'text-gray-600'}`}>
                    Level {lvl} {isCurrent && <span className="text-[#00F0FF] text-xs ml-1">← şu an</span>}
                  </div>
                  <div className="text-xs text-gray-600">{threshold} XP</div>
                </div>
                {isCurrentOrBelow && <span className="text-[#39FF14]">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rozetler */}
      <div className="bg-[#0A1128]/80 border border-[#FF9F43]/30 p-6 rounded-lg">
        <h3 className="text-[#FF9F43] font-bold text-sm uppercase tracking-wider mb-4">🏅 Rozetler</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGE_CONFIG.map(badge => {
            const earned = student.badges?.includes(badge.id);
            return (
              <div key={badge.id} className={`p-4 rounded-lg border text-center transition-all ${
                earned
                  ? 'bg-[#FF9F43]/10 border-[#FF9F43]/30 hover:border-[#FF9F43]/60'
                  : 'bg-gray-900/50 border-gray-800 opacity-50'
              }`}>
                <div className="text-3xl mb-2">{badge.emoji}</div>
                <div className={`text-xs font-bold ${earned ? 'text-[#FF9F43]' : 'text-gray-600'}`}>{badge.label}</div>
                <div className="text-[10px] text-gray-600 mt-1">{badge.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
