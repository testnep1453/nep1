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

      {/* LEVEL YOL HARİTASI — Cyber-Rank Sistemi */}
      <div className="bg-gradient-to-br from-[#0A1128] to-[#050505] border-t-2 border-[#6358cc]/30 p-6 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,88,204,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,88,204,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <h3 className="text-white font-black text-xl tracking-[4px] uppercase flex items-center gap-3">
            <span className="text-[#00F0FF] text-2xl">⚡</span>
            Siber Rütbe Haritası
          </h3>
        </div>
        
        {/* Yatay Scroll Container */}
        <div className="flex items-center overflow-x-auto pb-8 pt-4 relative snap-x snap-mandatory scrollbar-hide">
          {/* Arka Plan Ana Yolu (Siber Kablo) */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1a1f33] -translate-y-1/2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#00F0FF] via-[#6358cc] to-[#39FF14] transition-all duration-1000"
              style={{ width: `${Math.min((currentLevel / 10) * 100, 100)}%` }}
            />
          </div>

          <div className="flex items-center px-4 w-max gap-8 relative z-10">
            {LEVEL_THRESHOLDS.slice(0, 10).map((threshold, idx) => {
              const lvl = idx + 1;
              const isUnlocked = lvl <= currentLevel;
              const isCurrent = lvl === currentLevel;
              const color = LEVEL_COLORS[idx];
              const isLast = lvl === 10;

              return (
                <div key={lvl} className="flex flex-col items-center snap-center relative w-20">
                  
                  {/* Etiket — Sadece Mevcut Level'da veya MAX'ta göster */}
                  <div className="h-6 mb-4 flex items-end">
                    {isCurrent && (
                      <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/50 text-[#00F0FF] px-2 py-0.5 text-[9px] uppercase font-black tracking-widest animate-pulse whitespace-nowrap">
                        Operatör
                      </div>
                    )}
                    {isLast && !isCurrent && (
                      <div className="text-yellow-500 text-lg drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">👑</div>
                    )}
                  </div>

                  {/* Elmas Şekilli Düğüm (Cyber Diamond) */}
                  <div className="relative flex justify-center items-center h-14 w-14">
                    {/* Dış Elmas */}
                    <div
                      className="absolute inset-0 rotate-45 transition-transform duration-300"
                      style={{
                        background: isUnlocked ? `linear-gradient(135deg, ${color}44, ${color}11)` : '#0c1222',
                        border: `2px solid ${isUnlocked ? color : '#1f2937'}`,
                        transform: isCurrent ? 'rotate(45deg) scale(1.3)' : 'rotate(45deg) scale(1)',
                        boxShadow: isCurrent ? `0 0 15px ${color}40` : 'none',
                      }}
                    />
                    
                    {/* İç Rakam (Düz Duran Rakam) */}
                    <div className="relative z-10 font-bold text-lg flex items-center justify-center transform transition-transform"
                      style={{
                        color: isUnlocked ? (isCurrent ? '#fff' : color) : '#4b5563',
                        textShadow: isCurrent ? `0 0 10px ${color}` : 'none',
                        transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                      }}
                    >
                      {isUnlocked && !isCurrent ? '✓' : lvl}
                    </div>
                  </div>

                  {/* Alt Metin */}
                  <div className="mt-5 text-center transition-all">
                    <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: isUnlocked ? color : '#4b5563' }}>
                      LVL {lvl}
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono mt-1 w-16 px-1 rounded bg-black/50 border border-white/5">
                      {threshold.toLocaleString()} XP
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
        
        {/* Scroll Hint */}
        <div className="text-center mt-2 text-[10px] text-white/30 uppercase tracking-widest flex items-center justify-center gap-4">
          <span className="w-8 h-[1px] bg-white/20"></span>
          Haritayı Kaydır
          <span className="w-8 h-[1px] bg-white/20"></span>
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
