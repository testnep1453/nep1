import { useState } from 'react';
import { Student } from '../../types/student';
import { Trophy, Star, Zap } from 'lucide-react';
import { updateNickname } from '../../services/dbFirebase';

interface ProfileSectionProps {
  student: Student;
  isAdmin?: boolean;
}

const AVATAR_EMOJIS: Record<string, string> = {
  hero_1: '🦸‍♂️',
  hero_2: '🥷',
  hero_3: '🧙‍♂️',
  hero_4: '🤖',
  hero_5: '👨‍🚀',
  hero_6: '🐉',
  hero_7: '⚔️',
  hero_8: '🛡️'
};

const BADGE_INFO: Record<string, { emoji: string; name: string; hint: string }> = {
  first_login: { emoji: '🎮', name: 'İlk Giriş', hint: 'Karanlık evrene attığın ilk adım.' },
  week_streak: { emoji: '🔥', name: '1 Hafta', hint: 'Art arda 7 gün boyunca üsse giriş yap.' },
  quiz_master: { emoji: '🧠', name: 'Quiz Ustası', hint: 'Ajan quizinden mükemmel puan al.' },
  perfect_score: { emoji: '💯', name: 'Mükemmel', hint: 'Görevleri hiç hata yapmadan bitir.' },
  fast_learner: { emoji: '⚡', name: 'Hızlı', hint: 'Süreli bir görevi rekor zamanda bitir.' },
  team_player: { emoji: '🤝', name: 'Takım', hint: 'Müttefiklerinle beraber büyük operasyonu tamamla.' }
};

export const ProfileSection = ({ student, isAdmin = false }: ProfileSectionProps) => {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(student.nickname || '');
  const [saving, setSaving] = useState(false);

  const xpForNextLevel = student.level * 200;
  const xpProgress = (student.xp % 200) / 200 * 100;

  const handleSaveNickname = async () => {
    if (!nicknameValue.trim() || nicknameValue.trim() === student.nickname) {
      setIsEditingNickname(false);
      return;
    }

    setSaving(true);
    try {
      await updateNickname(student.id, nicknameValue.trim());
      student.nickname = nicknameValue.trim(); // Local güncelleme
      setIsEditingNickname(false);
    } catch {
      alert('Takma ad güncellenemedi. Tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#2d3142] to-[#25293c] rounded-2xl p-4 sm:p-6 border-2 border-[#6358cc]/30 shadow-xl">
      <div className="flex items-center gap-4 sm:gap-6 mb-6">
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#6358cc] to-[#8b7fd8] rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-lg">
            {AVATAR_EMOJIS[student.avatar] || '🎮'}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#ff9f43] rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border-2 border-[#25293c] shadow-lg">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wide truncate">
            {student.name}
          </h2>

          {/* Nickname Düzenleme (Görev 6) */}
          {isEditingNickname ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={nicknameValue}
                onChange={(e) => setNicknameValue(e.target.value)}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                className="bg-[#050505] border border-[#00cfe8] text-[#00cfe8] px-2 py-1 text-sm rounded font-mono focus:outline-none w-full max-w-[150px]"
                placeholder="Takma adın..."
              />
              <button
                onClick={handleSaveNickname}
                disabled={saving}
                className="text-[#39FF14] text-xs font-bold hover:underline whitespace-nowrap min-w-[44px] min-h-[32px]"
              >
                {saving ? '...' : '✓'}
              </button>
              <button
                onClick={() => { setIsEditingNickname(false); setNicknameValue(student.nickname || ''); }}
                className="text-gray-500 text-xs font-bold hover:underline min-w-[44px] min-h-[32px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              {student.nickname ? (
                <div className="text-[#00cfe8] font-black tracking-widest text-sm drop-shadow-[0_0_5px_rgba(0,207,232,0.5)]">
                  « {student.nickname} »
                </div>
              ) : (
                <span className="text-gray-500 text-xs italic">Takma ad belirle</span>
              )}
              <button
                onClick={() => setIsEditingNickname(true)}
                className="text-gray-600 hover:text-[#00cfe8] text-xs transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Takma adını düzenle"
              >
                ✏️
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="mt-2 px-3 py-1 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg inline-flex items-center gap-2">
              <span className="text-lg">👑</span>
              <span className="text-[#39FF14] text-xs font-bold tracking-widest uppercase">Sistem Yöneticisi</span>
            </div>
          )}

          {!isAdmin && (
            <div className="flex items-center gap-2 mb-1 sm:mb-2 mt-1">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff9f43]" />
              <span className="text-[#ff9f43] font-bold text-base sm:text-lg">
                LEVEL {student.level}
              </span>
            </div>
          )}
          {!isAdmin && (
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00cfe8]" />
              <span className="text-[#00cfe8] text-xs sm:text-sm font-semibold">
                {student.xp} XP
              </span>
            </div>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-xs sm:text-sm font-semibold">LEVEL İLERLEMESİ</span>
            <span className="text-white text-xs sm:text-sm font-bold">
              {student.xp % 200} / {xpForNextLevel}
            </span>
          </div>
          <div className="h-3 bg-[#1a1d2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6358cc] to-[#8b7fd8] rounded-full transition-all duration-1000 shadow-lg"
              style={{ width: `${xpProgress}%`, boxShadow: '0 0 10px #6358cc' }}
            />
          </div>
        </div>
      )}

      {!isAdmin && (
        <div>
          <h3 className="text-white font-bold mb-3 uppercase tracking-wide flex items-center gap-2 text-sm sm:text-base">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff9f43]" />
            ROZETLER
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(BADGE_INFO).map((badgeId) => {
              const badge = BADGE_INFO[badgeId];
              const unlocked = student.badges.includes(badgeId);
              return (
                <div
                  key={badgeId}
                  className={`group relative p-2 rounded-xl border-2 transition-all cursor-help flex flex-col items-center justify-center w-14 h-14 ${
                    unlocked
                      ? 'bg-[#1a1d2e] border-[#ff9f43] shadow-lg shadow-[#ff9f43]/30'
                      : 'bg-[#1a1d2e]/30 border-white/10 opacity-40 hover:opacity-80'
                  }`}
                >
                  <div className="text-xl text-center transition-transform group-hover:scale-110">
                    {badge.emoji}
                  </div>
                  <div className="absolute w-36 sm:w-40 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1d2e] border border-[#6358cc]/30 text-white text-xs text-center font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-xl pointer-events-none">
                    <div className="text-[#ff9f43] font-bold mb-1">{badge.name}</div>
                    {badge.hint}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#6358cc]/30" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
