import { Student } from '../../types/student';
import { Trophy, Star, Zap } from 'lucide-react';

interface ProfileSectionProps {
  student: Student;
}

const AVATAR_EMOJIS: Record<string, string> = {
  hero_cape_red: '🦸‍♂️',
  warrior_sword: '⚔️',
  knight_shield: '🛡️',
  wizard_staff: '🧙‍♂️',
  ninja_star: '🥷',
  robot_tech: '🤖',
  dragon_rider: '🐉',
  space_explorer: '👨‍🚀'
};

const BADGE_INFO: Record<string, { emoji: string; name: string }> = {
  first_login: { emoji: '🎮', name: 'İlk Giriş' },
  week_streak: { emoji: '🔥', name: '1 Hafta' },
  quiz_master: { emoji: '🧠', name: 'Quiz Ustası' },
  perfect_score: { emoji: '💯', name: 'Mükemmel' },
  fast_learner: { emoji: '⚡', name: 'Hızlı Öğrenci' },
  team_player: { emoji: '🤝', name: 'Takım Oyuncusu' }
};

export const ProfileSection = ({ student }: ProfileSectionProps) => {
  const xpForNextLevel = student.level * 200;
  const xpProgress = (student.xp % 200) / 200 * 100;

  return (
    <div className="bg-gradient-to-br from-[#2d3142] to-[#25293c] rounded-2xl p-6 border-2 border-[#6358cc]/30 shadow-xl">
      <div className="flex items-center gap-6 mb-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-[#6358cc] to-[#8b7fd8] rounded-2xl flex items-center justify-center text-5xl shadow-lg">
            {AVATAR_EMOJIS[student.avatar] || '🎮'}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#ff9f43] rounded-full w-8 h-8 flex items-center justify-center border-2 border-[#25293c] shadow-lg">
            <Star className="w-4 h-4 text-white" fill="white" />
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1 uppercase tracking-wide">
            {student.name}
          </h2>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-[#ff9f43]" />
            <span className="text-[#ff9f43] font-bold text-lg">
              LEVEL {student.level}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00cfe8]" />
            <span className="text-[#00cfe8] text-sm font-semibold">
              {student.xp} XP
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/70 text-sm font-semibold">LEVEL İLERLEMESİ</span>
          <span className="text-white text-sm font-bold">
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

      <div>
        <h3 className="text-white font-bold mb-3 uppercase tracking-wide flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#ff9f43]" />
          ROZETLER
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.keys(BADGE_INFO).map((badgeId) => {
            const badge = BADGE_INFO[badgeId];
            const unlocked = student.badges.includes(badgeId);
            return (
              <div
                key={badgeId}
                className={`relative p-3 rounded-xl border-2 transition-all ${
                  unlocked
                    ? 'bg-[#1a1d2e] border-[#ff9f43] shadow-lg shadow-[#ff9f43]/30'
                    : 'bg-[#1a1d2e]/30 border-white/10 opacity-40'
                }`}
              >
                <div className="text-3xl text-center mb-1">
                  {badge.emoji}
                </div>
                <div className="text-xs text-center text-white/70 font-semibold">
                  {badge.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
