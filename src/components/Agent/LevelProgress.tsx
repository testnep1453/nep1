import { useEffect, useState } from 'react';
import { Student } from '../../types/student';
import confetti from 'canvas-confetti';
import { getStudentBadges, checkAndAwardBadge } from '../../services/supabaseService';

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000, 25000];
const LEVEL_COLORS = [
  '#6b7280', '#3b82f6', '#22c55e', '#84cc16', '#eab308', 
  '#f97316', '#ef4444', '#a855f7', '#00F0FF', '#FFD700'
];

interface BadgeMetadata {
  key: string;
  label: string;
  emoji: string;
  description: string;
}

const BADGE_METADATA: BadgeMetadata[] = [
  { key: 'us_anahtari', label: 'ÜS ANAHTARI', emoji: '🎖️', description: 'Sisteme ilk sızma harekatı başarılı.' },
  { key: 'kesintisiz_takip', label: 'KESİNTİSİZ TAKİP', emoji: '🔥', description: '7 gün boyunca üssü terk etmedin.' },
  { key: 'veri_uzmani', label: 'VERİ UZMANI', emoji: '🧠', description: 'Quizi %100 doğrulukla tamamladın.' },
  { key: 'kusursuz_ajan', label: 'KUSURSUZ AJAN', emoji: '💯', description: 'Tüm operasyonlara eksiksiz katılım.' },
  { key: 'hizli_mudahele', label: 'HIZLI MÜDAHALE', emoji: '⚡', description: 'Görevi ilk 1 dakikada başlattın.' },
  { key: 'takim_ruhu', label: 'TAKIM RUHU', emoji: '💛', description: 'Ekip operasyonlarında üstün başarı.' },
];

export const LevelProgress = ({ student }: { student: Student }) => {
  const currentLevel = student.level || 1;
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  const getRankTitle = (lvl: number) => {
    if (lvl <= 2) return 'ÇAYLAK (RECRUIT)';
    if (lvl <= 5) return 'GÖZCÜ (SCOUT)';
    if (lvl <= 8) return 'UZMAN (SPECIALIST)';
    return 'KOMUTAN (COMMANDER)';
  };

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const badges = await getStudentBadges(student.id);
        setEarnedBadges(badges);
        
        // snake_case kullanımı
        const hasFirstLogin = badges.some((b: any) => b.badge_key === 'us_anahtari');
        if (!hasFirstLogin) {
          const awarded = await checkAndAwardBadge(student.id, 'us_anahtari');
          if (awarded) {
            const updatedBadges = await getStudentBadges(student.id);
            setEarnedBadges(updatedBadges);
            confetti({
              particleCount: 150, spread: 100, origin: { y: 0.6 },
              colors: ['#00F0FF', '#39FF14', '#FF4500'], zIndex: 200
            });
          }
        }
      } catch (err) {
        console.error("Badge fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [student.id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* LEVEL YOL HARİTASI */}
      <div className="bg-gradient-to-br from-[#0A1128] to-[#050505] border-t-2 border-[#6358cc]/30 p-6 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,88,204,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,88,204,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <h3 className="text-white font-black text-xl tracking-[4px] uppercase flex items-center gap-3">
            <span className="text-[#00F0FF] text-2xl">⚡</span>
            Siber Rütbe Haritası
          </h3>
          <div className="text-[10px] text-[#00F0FF] font-mono border border-[#00F0FF]/30 px-3 py-1 rounded bg-black/40">
            Mevcut Rütbe: <span className="font-bold text-[#39FF14]">{getRankTitle(currentLevel)}</span>
          </div>
        </div>
        
        <div className="flex items-center overflow-x-auto pb-8 pt-4 relative snap-x snap-mandatory scrollbar-hide">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#1a1f33] -translate-y-1/2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00F0FF] via-[#6358cc] to-[#39FF14] transition-all duration-1000" style={{ width: `${Math.min((currentLevel / 10) * 100, 100)}%` }} />
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
                  <div className="h-6 mb-4 flex items-end text-center">
                    {isCurrent && <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/50 text-[#00F0FF] px-2 py-0.5 text-[8px] uppercase font-black tracking-widest animate-pulse whitespace-nowrap">{getRankTitle(lvl).split(' ')[0]}</div>}
                    {isLast && !isCurrent && <div className="text-yellow-500 text-lg drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">👑</div>}
                  </div>

                  <div className="relative flex justify-center items-center h-14 w-14">
                    <div className="absolute inset-0 rotate-45 transition-transform duration-300" style={{ background: isUnlocked ? `linear-gradient(135deg, ${color}44, ${color}11)` : '#0c1222', border: `2px solid ${isUnlocked ? color : '#1f2937'}`, transform: isCurrent ? 'rotate(45deg) scale(1.3)' : 'rotate(45deg) scale(1)', boxShadow: isCurrent ? `0 0 15px ${color}40` : 'none' }} />
                    <div className="relative z-10 font-bold text-lg flex items-center justify-center transform transition-transform" style={{ color: isUnlocked ? (isCurrent ? '#fff' : color) : '#4b5563', textShadow: isCurrent ? `0 0 10px ${color}` : 'none', transform: isCurrent ? 'scale(1.2)' : 'scale(1)' }}>
                      {isUnlocked && !isCurrent ? '✓' : lvl}
                    </div>
                  </div>

                  <div className="mt-5 text-center transition-all">
                    <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: isUnlocked ? color : '#4b5563' }}>LVL {lvl}</div>
                    <div className="text-[9px] text-gray-500 font-mono mt-1 w-16 px-1 rounded bg-black/50 border border-white/5 mx-auto">{threshold.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MEDAL ROOM */}
      <div className="bg-[#0A1128] border border-[#00F0FF]/20 rounded-2xl p-6 relative overflow-visible shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-white font-black text-xl tracking-[2px] uppercase flex items-center gap-3">
              <span className="text-[#39FF14]">🏅</span> MADALYA ODASI
            </h3>
            <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-wider uppercase">Operasyon başarımı ve özel yetki belgeleri</p>
          </div>
          <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 px-3 py-1 rounded text-[#39FF14] text-xs font-bold font-mono">
            {earnedBadges.length} / {BADGE_METADATA.length} KOLEKSİYON
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {BADGE_METADATA.map((badge) => {
            // snake_case kullanımı
            const earnedInfo = earnedBadges.find(b => b.badge_key === badge.key);
            const isEarned = !!earnedInfo;
            const isHovered = hoveredBadge === badge.key;

            return (
              <div key={badge.key} className="relative group cursor-help" onMouseEnter={() => setHoveredBadge(badge.key)} onMouseLeave={() => setHoveredBadge(null)} onTouchStart={() => setHoveredBadge(badge.key === hoveredBadge ? null : badge.key)}>
                <div className={`relative p-4 rounded-xl border-2 transition-all duration-500 flex flex-col items-center justify-center gap-3 h-40 overflow-hidden ${isEarned ? 'bg-gradient-to-b from-[#00F0FF]/10 to-[#39FF14]/5 border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] opacity-100 scale-100' : 'bg-black/40 border-white/5 opacity-30 grayscale scale-95 hover:opacity-50'}`}>
                  
                  {isEarned && (
                    <>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent animate-pulse" />
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#00F0FF]/20 to-[#39FF14]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}

                  <div className={`text-4xl transition-transform duration-500 ${isEarned ? 'group-hover:scale-110 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]' : ''}`}>{badge.emoji}</div>
                  
                  <div className="text-center">
                    <h4 className={`text-[11px] font-black tracking-widest uppercase mb-1 ${isEarned ? 'text-white' : 'text-gray-600'}`}>{badge.label}</h4>
                    {isEarned ? (
                      <div className="text-[9px] text-[#39FF14] font-mono font-bold animate-pulse uppercase">Kazanıldı: {formatDate(earnedInfo.earned_at)}</div>
                    ) : (
                      <div className="text-[9px] text-gray-500 font-mono tracking-tighter uppercase border border-white/10 px-2 py-0.5 rounded">KİLİTLİ</div>
                    )}
                  </div>

                  {isHovered && (
                    <div className="absolute inset-0 z-50 bg-[#050505] border border-[#00F0FF]/50 p-4 animate-in fade-in zoom-in duration-200 flex flex-col justify-center shadow-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full animate-pulse" />
                        <span className="text-[9px] text-[#00F0FF] font-mono tracking-widest uppercase italic">DETAY_SORGUSU_...</span>
                      </div>
                      <p className="text-[11px] text-white font-mono leading-relaxed lowercase italic border-l-2 border-[#00F0FF]/30 pl-2">&gt; {badge.description}</p>
                      <div className="mt-4 pt-2 border-t border-[#00F0FF]/20 flex justify-between items-center text-[8px] text-gray-500 font-mono">
                        <span>DURUM: {isEarned ? 'DOĞRULANDI' : 'ŞİFRELİ'}</span>
                        <span className="text-[#00F0FF] opacity-50 tabular-nums">0x{badge.key.length}FF</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
