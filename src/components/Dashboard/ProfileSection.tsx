import { useState, useEffect } from 'react';
import { Student } from '../../types/student';
import { Shield, Lock, Zap } from 'lucide-react';
import { updateStudent } from '../../services/supabaseService';
import confetti from 'canvas-confetti';

interface ProfileSectionProps {
  student: Student;
  isAdmin?: boolean;
}

const INVENTORY_ITEMS = [
  { id: 'item_goggles', name: 'Gece Görüş Gözlüğü', reqLevel: 2, icon: '🕶️' },
  { id: 'item_spy_watch', name: 'Casus Saat', reqLevel: 4, icon: '⌚' },
  { id: 'item_drone', name: 'Gözlem Dronu', reqLevel: 6, icon: '🚁' },
  { id: 'item_shield', name: 'Enerji Kalkanı', reqLevel: 8, icon: '🛡️' },
  { id: 'item_jetpack', name: 'Sırt Roketi', reqLevel: 10, icon: '🚀' },
  { id: 'item_hacker', name: 'Hackleme Cihazı', reqLevel: 12, icon: '💻' },
];



export const ProfileSection = ({ student, isAdmin = false }: ProfileSectionProps) => {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(student.nickname || '');
  const [saving, setSaving] = useState(false);
  const [xpChanged, setXpChanged] = useState(false);
  const [scrambledCode, setScrambledCode] = useState('');

  const agentCode = `AGENT-TR-${student.id}`;
  
  const totalXpInLevel = 200;
  const xpForNextLevel = totalXpInLevel;
  const currentXpProgress = student.xp % totalXpInLevel;
  const xpProgress = (currentXpProgress / totalXpInLevel) * 100;

  // Rank title logic
  const getRankTitle = (lvl: number) => {
    if (lvl <= 2) return 'ÇAYLAK (RECRUIT)';
    if (lvl <= 5) return 'GÖZCÜ (SCOUT)';
    if (lvl <= 8) return 'UZMAN (SPECIALIST)';
    return 'KOMUTAN (COMMANDER)';
  };

  // Scramble animation effect for Agent Code
  useEffect(() => {
    let iterations = 0;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const interval = setInterval(() => {
      setScrambledCode(prev => 
        agentCode.split('')
          .map((char, index) => {
            if (index < iterations) return agentCode[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      if (iterations >= agentCode.length) clearInterval(interval);
      iterations += 1/3;
    }, 30);
    return () => clearInterval(interval);
  }, [agentCode]);

  // Visual feedback on level up or XP gain
  useEffect(() => {
    if (student.xp > 0) {
      setXpChanged(true);
      const timer = setTimeout(() => setXpChanged(false), 1000);
      
      // Level up feedback
      const prevLevel = Number(sessionStorage.getItem(`agent_level_${student.id}`) || student.level);
      if (student.level > prevLevel) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00F0FF', '#39FF14', '#FF4500']
        });
      }
      sessionStorage.setItem(`agent_level_${student.id}`, student.level.toString());
      
      return () => clearTimeout(timer);
    }
  }, [student.xp, student.level, student.id]);

  const handleSaveNickname = async () => {
    if (!nicknameValue.trim() || nicknameValue.trim() === student.nickname) {
      setIsEditingNickname(false);
      return;
    }
    setSaving(true);
    try {
      await updateStudent(student.id, { nickname: nicknameValue.trim() });
      student.nickname = nicknameValue.trim();
      setIsEditingNickname(false);
    } catch {
      alert('Hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1d2e] to-[#0A1128] rounded-3xl p-5 md:p-10 border border-[#00F0FF]/30 shadow-[0_0_40px_rgba(0,240,255,0.05)] w-full h-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16 overflow-hidden">

      {/* SOL: KİMLİK */}
      <div className="flex flex-col items-center text-center w-full lg:w-1/3 shrink-0">
        <div className="relative mb-2">
          <div className="bg-[#00F0FF] text-[#0A1128] font-black text-sm md:text-base px-6 py-2 rounded-xl border-2 border-[#0A1128] shadow-lg whitespace-nowrap">
            LVL {student.level}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[#00F0FF] text-[10px] md:text-xs font-mono tracking-[0.3em] font-black uppercase mb-1">Kimlik_Dosyası</div>
          <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-wider">{student.name}</h2>
          <div className="text-gray-500 font-mono text-[9px] md:text-[11px] mt-1 tracking-widest bg-black/30 px-3 py-1 rounded inline-block">
            {scrambledCode}
          </div>
        </div>

        <div className="text-[10px] md:text-xs text-[#39FF14] font-black tracking-widest uppercase mb-1 bg-[#39FF14]/10 px-3 py-1 rounded border border-[#39FF14]/20">
          Rank: {getRankTitle(student.level)}
        </div>

        {isEditingNickname ? (
          <div className="flex items-center justify-center gap-2 mt-3 w-full max-w-[200px]">
            <input
              id="profile-section-nickname"
              name="profile-section-nickname"
              aria-label="Takma ad düzenle"
              autoComplete="nickname"
              type="text"
              value={nicknameValue}
              onChange={e => setNicknameValue(e.target.value)}
              maxLength={20}
              autoFocus
              className="bg-[#050505] border border-[#00F0FF] text-[#00F0FF] px-3 py-1.5 text-sm rounded font-mono focus:outline-none w-full"
            />
            <button
              onClick={handleSaveNickname}
              disabled={saving}
              className="text-[#39FF14] text-sm font-bold bg-[#39FF14]/10 px-2.5 py-1.5 rounded"
            >
              {saving ? '...' : '✓'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mt-2 group">
            <div className="text-[#00F0FF] font-mono tracking-[0.2em] text-sm md:text-base font-bold bg-white/5 px-4 py-1 rounded-full border border-white/5 group-hover:border-[#00F0FF]/30 transition-all">
              &gt; {student.nickname || 'FIELD_AGENT'} &lt;
            </div>
            <button onClick={() => setIsEditingNickname(true)} className="opacity-40 group-hover:opacity-100 hover:text-[#00F0FF] transition-all">✏️</button>
          </div>
        )}

        {!isAdmin && (
          <div className="flex items-center gap-2 mt-4 bg-white/5 inline-flex px-4 py-2 rounded-lg border border-white/10">
            <Zap className="w-4 h-4 text-[#39FF14]" fill="#39FF14" />
            <span className="text-gray-300 text-sm font-mono">Veri_Puanı: <span className="text-[#39FF14] font-bold text-lg">{student.xp}</span></span>
          </div>
        )}
      </div>

      {/* SAĞ: XP BAR VE ENVANTER */}
      {!isAdmin && (
        <div className={`w-full lg:w-2/3 flex flex-col gap-4 md:gap-6 justify-center ${xpChanged ? 'animate-screen-shake' : ''}`}>
          <div className="bg-black/40 p-4 md:p-5 rounded-2xl border border-gray-800 relative overflow-hidden group">
            <div className="flex justify-between items-end mb-2">
              <span className="text-gray-500 text-[10px] md:text-xs font-mono tracking-widest uppercase">Sonraki Level Hedefi</span>
              <span className="text-[#00F0FF] text-xs md:text-sm font-mono font-bold">{currentXpProgress} / {totalXpInLevel} XP</span>
            </div>
            <div className={`h-4 md:h-6 bg-[#050505] rounded-full overflow-hidden border border-gray-800 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] relative ${xpProgress >= 100 ? 'animate-neon-glow-cyan' : ''}`}>
              <div
                className="h-full bg-gradient-to-r from-[#00F0FF] via-[#6358cc] to-[#39FF14] rounded-full transition-all duration-1000 relative shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                style={{ width: `${xpProgress}%` }}
              >
                {/* Scanning Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-20 animate-scan-line pointer-events-none" />
                
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]" />
              </div>
            </div>
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-[#00F0FF]/5 blur-xl opacity-50 pointer-events-none" />
          </div>

          <div>
            <h3 className="text-gray-400 font-bold mb-3 uppercase tracking-widest flex items-center gap-2 text-[10px] md:text-xs border-b border-gray-800 pb-2">
              <Shield className="w-4 h-4 text-[#00F0FF]" /> KİLİDİ AÇILAN TEÇHİZATLAR
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4">
              {INVENTORY_ITEMS.map(item => {
                const isUnlocked = student.level >= item.reqLevel;
                return (
                  <div
                    key={item.id}
                    className={`relative flex flex-col items-center justify-center p-2 md:p-4 rounded-xl border-2 transition-all h-16 md:h-24 ${
                      isUnlocked
                        ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'bg-black/50 border-gray-800 opacity-40'
                    }`}
                  >
                    <div className={`text-2xl md:text-4xl ${!isUnlocked && 'grayscale opacity-50'}`}>{item.icon}</div>
                    {isUnlocked && (
                      <div className="text-[8px] md:text-[10px] text-[#00F0FF] mt-1 font-bold tracking-wider hidden sm:block truncate w-full text-center">
                        {item.name}
                      </div>
                    )}
                    {!isUnlocked && <Lock className="absolute top-1.5 right-1.5 w-2.5 h-2.5 md:w-3 md:h-3 text-gray-600" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



