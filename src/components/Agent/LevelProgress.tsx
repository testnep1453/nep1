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

const LEVEL_COLORS = [
  '#6b7280', // 1
  '#3b82f6', // 2
  '#22c55e', // 3
  '#84cc16', // 4
  '#eab308', // 5
  '#f97316', // 6
  '#ef4444', // 7
  '#a855f7', // 8
  '#00F0FF', // 9
  '#FFD700', // 10
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
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-[#00F0FF]/10 border-2 border-[#00F0FF]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <span className="text-2xl font-bold text-[#00F0FF]">{currentLevel}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Level {currentLevel}</h3>
            <p className="text-gray-400 text-sm font-mono">{currentXP} / {nextThreshold} XP</p>
          </div>
        </div>
        <div className="mb-1">
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

      {/* LEVEL YOL HARİTASI — Dikey zincir görsel */}
      <div className="bg-[#0A1128]/80 border border-[#6358cc]/30 p-6 rounded-lg">
        <h3 className="text-[#8b7fd8] font-bold text-sm uppercase tracking-wider mb-6">🗺️ Level Yol Haritası</h3>
        
        <div className="relative flex flex-col items-center gap-0">
          {LEVEL_THRESHOLDS.slice(0, 10).map((threshold, idx) => {
            const lvl = idx + 1;
            const isUnlocked = lvl <= currentLevel;
            const isCurrent = lvl === currentLevel;
            const color = LEVEL_COLORS[idx];
            const isLast = lvl === 10;

            return (
              <div key={lvl} className="relative flex flex-col items-center w-full">
                {/* Konnektör çizgi (üst) */}
                {idx > 0 && (
                  <div
                    className="w-0.5 h-6"
                    style={{ background: isUnlocked ? `linear-gradient(to bottom, ${LEVEL_COLORS[idx - 1]}, ${color})` : '#1f2937' }}
                  />
                )}

                {/* Level Düğümü */}
                <div className={`relative flex items-center gap-4 w-full max-w-sm px-3 py-3 rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                    : isUnlocked
                    ? 'bg-white/5 border-white/10'
                    : 'bg-[#050505] border-gray-800/50 opacity-50'
                }`}>

                  {/* Daire */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 border-2"
                    style={{
                      background: isUnlocked ? `${color}22` : '#111827',
                      borderColor: isUnlocked ? color : '#374151',
                      color: isUnlocked ? color : '#6b7280',
                      boxShadow: isCurrent ? `0 0 16px ${color}66` : 'none',
                    }}
                  >
                    {isUnlocked && !isCurrent ? '✓' : lvl}
                  </div>

                  {/* Metin */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: isUnlocked ? color : '#6b7280' }}>
                        Level {lvl}
                        {isLast && <span className="ml-1 text-[10px] text-yellow-400">👑 MAX</span>}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] bg-[#00F0FF]/20 text-[#00F0FF] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                          ŞU AN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 font-mono">{threshold.toLocaleString()} XP</div>
                  </div>

                  {/* Sağ XP göstergesi (current) */}
                  {isCurrent && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono text-[#00F0FF]">{currentXP}</div>
                      <div className="text-[10px] text-gray-600">/ {nextThreshold}</div>
                    </div>
                  )}
                </div>

                {/* Konnektör (alt, son hariç) */}
                {!isLast && (
                  <div
                    className="w-0.5 h-6"
                    style={{ background: isUnlocked ? `linear-gradient(to bottom, ${color}, ${LEVEL_COLORS[idx + 1]})` : '#1f2937' }}
                  />
                )}
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
                  : 'bg-gray-900/50 border-gray-800 opacity-40'
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
