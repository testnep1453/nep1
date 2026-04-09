import { useState, useEffect } from 'react';
import { Student } from '../../types/student';
import { Shield, Lock, Zap } from 'lucide-react';
import { updateNickname, updateStudentInFirebase } from '../../services/dbFirebase';

interface ProfileSectionProps {
  student: Student;
  isAdmin?: boolean;
}

const INVENTORY_ITEMS = [
  { id: 'item_1', name: 'Taktik Kulaklık', reqLevel: 1, icon: '🎧' },
  { id: 'item_2', name: 'Siber Tablet', reqLevel: 2, icon: '📱' },
  { id: 'item_3', name: 'Gece Görüşü', reqLevel: 4, icon: '🕶️' },
  { id: 'item_4', name: 'Lazer Kesici', reqLevel: 6, icon: '🔦' },
  { id: 'item_5', name: 'EMP Bombası', reqLevel: 8, icon: '💣' },
  { id: 'item_6', name: 'Hayalet Pelerini', reqLevel: 10, icon: '🥷' },
];

const AVATAR_IDS = Array.from({ length: 30 }, (_, i) => `av${i + 1}`);

const normalizeAvatarId = (avatarId: string): string => {
  if (!avatarId) return 'av1';
  // Eski 'hero_1' formatını 'av1'e çevir
  if (avatarId.startsWith('hero_')) {
    const num = parseInt(avatarId.replace('hero_', ''), 10);
    return `av${isNaN(num) ? 1 : Math.min(num, 30)}`;
  }
  // URL veya bilinmeyen format - fallback
  if (avatarId.includes(':') || avatarId.includes('/')) return 'av1';
  // Geçerli av{n} formatı
  if (/^av\d+$/.test(avatarId)) return avatarId;
  return 'av1';
};

const getAvatarUrl = (avatarId: string) => {
  const normalized = normalizeAvatarId(avatarId);
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : base + '/'}avatars/${normalized}.svg`;
};

export const ProfileSection = ({ student, isAdmin = false }: ProfileSectionProps) => {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(student.nickname || '');
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(() => normalizeAvatarId(student.avatar || ''));

  useEffect(() => {
    setLocalAvatar(normalizeAvatarId(student.avatar || ''));
  }, [student.avatar]);

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
      student.nickname = nicknameValue.trim();
      setIsEditingNickname(false);
    } catch {
      alert('Hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    if (isAdmin) return;
    setLocalAvatar(avatarId); // Optimistic update
    setShowPicker(false);
    try {
      await updateStudentInFirebase(student.id, { avatar: avatarId });
      student.avatar = avatarId;
    } catch (error) {
      console.error('Karakter güncellenemedi', error);
      // Hata durumunda eski avatara dön
      setLocalAvatar(normalizeAvatarId(student.avatar || ''));
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1d2e] to-[#0A1128] rounded-3xl p-5 md:p-10 border border-[#00F0FF]/30 shadow-[0_0_40px_rgba(0,240,255,0.05)] w-full h-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16 overflow-hidden">

      {/* Avatar Picker Modal */}
      {showPicker && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="bg-[#0A1128] border border-[#00F0FF]/40 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_40px_rgba(0,240,255,0.2)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#00F0FF] font-black text-lg tracking-widest uppercase">Karakter Seç</h3>
              <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {AVATAR_IDS.map(id => (
                <button
                  key={id}
                  onClick={() => handleSelectAvatar(id)}
                  className={`relative rounded-xl border-2 p-1 transition-all hover:scale-110 ${
                    localAvatar === id
                      ? 'border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.6)] bg-[#00F0FF]/10'
                      : 'border-gray-700 hover:border-[#00F0FF]/50 bg-black/30'
                  }`}
                >
                  <img
                    src={getAvatarUrl(id)}
                    alt={id}
                    className="w-full aspect-square object-contain"
                    loading="lazy"
                  />
                  {localAvatar === id && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00F0FF] rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-black font-black">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs text-center mt-3 tracking-wider">30 farklı ajan karakteri</p>
          </div>
        </div>
      )}

      {/* SOL: AVATAR VE KİMLİK */}
      <div className="flex flex-col items-center text-center w-full lg:w-1/3 shrink-0">
        <div
          className={`relative mb-4 ${!isAdmin ? 'cursor-pointer group' : ''}`}
          onClick={() => !isAdmin && setShowPicker(true)}
          title={!isAdmin ? 'Karakter Seç' : ''}
        >
          <div className="w-24 h-24 md:w-40 md:h-40 rounded-3xl bg-gradient-to-b from-slate-100 to-slate-300 border-4 border-[#00F0FF] p-2 shadow-[0_0_30px_rgba(0,240,255,0.4)] relative overflow-hidden">
            <img
              src={getAvatarUrl(localAvatar)}
              alt="Avatar"
              className="w-full h-full object-contain drop-shadow-xl"
            />
            {!isAdmin && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <span className="text-[#39FF14] text-2xl mb-1">🎭</span>
                <span className="text-[#39FF14] text-[10px] font-black tracking-widest">DEĞİŞTİR</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#00F0FF] text-[#0A1128] font-black text-xs md:text-sm px-4 py-1 rounded-lg border-2 border-[#0A1128] shadow-lg whitespace-nowrap z-10">
            LVL {student.level}
          </div>
        </div>

        <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-wider mt-3">{student.name}</h2>

        {isEditingNickname ? (
          <div className="flex items-center justify-center gap-2 mt-3">
            <input
              type="text"
              value={nicknameValue}
              onChange={e => setNicknameValue(e.target.value)}
              maxLength={20}
              autoFocus
              className="bg-[#050505] border border-[#00F0FF] text-[#00F0FF] px-3 py-1.5 text-sm rounded font-mono focus:outline-none w-full max-w-[160px]"
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
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="text-[#00F0FF] font-mono tracking-widest text-sm md:text-base font-bold">» {student.nickname || 'AJAN'} «</div>
            <button onClick={() => setIsEditingNickname(true)} className="text-gray-600 hover:text-[#00F0FF] transition-colors">✏️</button>
          </div>
        )}

        {!isAdmin && (
          <div className="flex items-center gap-2 mt-4 bg-white/5 inline-flex px-4 py-2 rounded-lg border border-white/10">
            <Zap className="w-4 h-4 text-[#39FF14]" fill="#39FF14" />
            <span className="text-gray-300 text-sm font-mono">XP Puanı: <span className="text-[#39FF14] font-bold text-lg">{student.xp}</span></span>
          </div>
        )}
      </div>

      {/* SAĞ: XP BAR VE ENVANTER */}
      {!isAdmin && (
        <div className="w-full lg:w-2/3 flex flex-col gap-4 md:gap-6 justify-center">
          <div className="bg-black/40 p-4 md:p-5 rounded-2xl border border-gray-800">
            <div className="flex justify-between items-end mb-2">
              <span className="text-gray-500 text-[10px] md:text-xs font-mono tracking-widest uppercase">Sonraki Level Hedefi</span>
              <span className="text-[#00F0FF] text-xs md:text-sm font-mono font-bold">{student.xp % 200} / {xpForNextLevel} XP</span>
            </div>
            <div className="h-3 md:h-4 bg-[#050505] rounded-full overflow-hidden border border-gray-800 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#00F0FF] to-[#39FF14] rounded-full transition-all duration-1000 relative"
                style={{ width: `${xpProgress}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[pan_1s_linear_infinite]" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-gray-400 font-bold mb-3 uppercase tracking-widest flex items-center gap-2 text-[10px] md:text-xs border-b border-gray-800 pb-2">
              <Shield className="w-4 h-4 text-[#00F0FF]" /> KİLİDİ AÇILAN TEÇHİZATLAR
            </h3>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
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
