import { useState } from 'react';
import { Student } from '../../types/student';
import { Shield, Lock, Unlock, Zap } from 'lucide-react';
import { updateNickname } from '../../services/dbFirebase';

interface ProfileSectionProps {
  student: Student;
  isAdmin?: boolean;
}

// YENİ ENVANTER SİSTEMİ (XP/Level'a göre açılır)
const INVENTORY_ITEMS = [
  { id: 'item_1', name: 'Taktik Kulaklık', reqLevel: 1, icon: '🎧', desc: 'Merkezle kriptolu iletişim kurmanı sağlar.' },
  { id: 'item_2', name: 'Siber Tablet', reqLevel: 2, icon: '📱', desc: 'Düşman güvenlik duvarlarını hacklemek için kullanılır.' },
  { id: 'item_3', name: 'Gece Görüşü', reqLevel: 4, icon: '🕶️', desc: 'Karanlık operasyonlarda %100 netlik sağlar.' },
  { id: 'item_4', name: 'Lazer Kesici', reqLevel: 6, icon: '🔦', desc: 'Titanyum kapıları 3 saniyede eritir.' },
  { id: 'item_5', name: 'EMP Bombası', reqLevel: 8, icon: '💣', desc: '100 metre çapındaki tüm elektroniği çökertir.' },
  { id: 'item_6', name: 'Hayalet Pelerini', reqLevel: 10, icon: '🥷', desc: 'Termal ve optik kameralarda görünmez olmanı sağlar.' },
];

export const ProfileSection = ({ student, isAdmin = false }: ProfileSectionProps) => {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(student.nickname || '');
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false); // Resim bulunamazsa fallback için

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
      alert('Takma ad güncellenemedi. Tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1d2e] to-[#0A1128] rounded-2xl p-5 border border-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
      
      {/* ÜST KISIM: Profil Bilgileri */}
      <div className="flex items-center gap-5 mb-6">
        <div className="relative shrink-0 group">
          {/* Gerçekçi Avatar (Resim yüklenmezse kalkan ikonu çıkar) */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] bg-[#050505] flex items-center justify-center">
            {!imgError ? (
              <img 
                src={`${import.meta.env.BASE_URL}avatars/${student.avatar || 'hero_1'}.jpg`} 
                alt="Ajan Avatar" 
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Shield className="w-12 h-12 text-[#00F0FF]/50" />
            )}
          </div>
          <div className="absolute -bottom-3 -right-3 bg-[#00F0FF] rounded-lg px-2 py-1 flex items-center justify-center border border-[#0A1128] shadow-lg text-[#0A1128] font-black text-xs">
            LVL {student.level}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider truncate mb-1">
            {student.name}
          </h2>

          {isEditingNickname ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nicknameValue}
                onChange={(e) => setNicknameValue(e.target.value)}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                className="bg-[#050505] border border-[#00F0FF] text-[#00F0FF] px-2 py-1.5 text-sm rounded font-mono focus:outline-none w-full max-w-[160px]"
                placeholder="Takma adın..."
              />
              <button onClick={handleSaveNickname} disabled={saving} className="text-[#39FF14] text-sm font-bold bg-[#39FF14]/10 px-2 py-1 rounded">
                {saving ? '...' : '✓'}
              </button>
              <button onClick={() => { setIsEditingNickname(false); setNicknameValue(student.nickname || ''); }} className="text-[#FF4500] text-sm font-bold bg-[#FF4500]/10 px-2 py-1 rounded">
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {student.nickname ? (
                <div className="text-[#00F0FF] font-mono tracking-widest text-sm drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                  » {student.nickname}
                </div>
              ) : (
                <span className="text-gray-500 text-xs italic font-mono">Takma ad belirle</span>
              )}
              <button onClick={() => setIsEditingNickname(true)} className="text-gray-600 hover:text-[#00F0FF] transition-colors ml-2" title="Takma adını düzenle">
                ✏️
              </button>
            </div>
          )}

          {isAdmin ? (
            <div className="mt-3 px-3 py-1 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded inline-flex items-center gap-2 text-[#39FF14] text-xs font-bold tracking-widest uppercase">
              👑 Sistem Yöneticisi
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3">
              <Zap className="w-4 h-4 text-[#00F0FF]" fill="#00F0FF" />
              <span className="text-gray-300 text-sm font-mono">
                Toplam XP: <span className="text-[#00F0FF] font-bold">{student.xp}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ORTA KISIM: İlerleme Çubuğu */}
      {!isAdmin && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-xs font-mono tracking-widest">SONRAKİ SEVİYE İÇİN</span>
            <span className="text-[#00F0FF] text-xs font-mono font-bold">
              {student.xp % 200} / {xpForNextLevel} XP
            </span>
          </div>
          <div className="h-2 bg-[#050505] rounded-full overflow-hidden border border-gray-800">
            <div
              className="h-full bg-gradient-to-r from-[#00F0FF] to-[#39FF14] rounded-full transition-all duration-1000 relative"
              style={{ width: `${xpProgress}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[pan_1s_linear_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* ALT KISIM: Ajan Envanteri */}
      {!isAdmin && (
        <div>
          <h3 className="text-gray-400 font-bold mb-3 uppercase tracking-widest flex items-center gap-2 text-sm border-b border-gray-800 pb-2">
            <Shield className="w-4 h-4" />
            AJAN ENVANTERİ
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {INVENTORY_ITEMS.map((item) => {
              const isUnlocked = student.level >= item.reqLevel;
              return (
                <div
                  key={item.id}
                  className={`group relative aspect-square rounded-xl border transition-all flex items-center justify-center cursor-help
                    ${isUnlocked 
                      ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:bg-[#00F0FF]/20' 
                      : 'bg-black/50 border-gray-800 opacity-50 hover:opacity-80'}`}
                >
                  <div className={`text-2xl transition-transform ${isUnlocked ? 'group-hover:scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'grayscale'}`}>
                    {item.icon}
                  </div>
                  
                  {/* Kilit İkonu */}
                  {!isUnlocked && (
                    <div className="absolute top-1 right-1 text-gray-500">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                  {isUnlocked && (
                    <div className="absolute top-1 right-1 text-[#39FF14]">
                      <Unlock className="w-3 h-3" />
                    </div>
                  )}

                  {/* Detay Tooltip */}
                  <div className="absolute w-48 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#0A1128] border border-[#00F0FF]/40 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 shadow-2xl pointer-events-none">
                    <div className={`font-bold mb-1 text-sm ${isUnlocked ? 'text-[#00F0FF]' : 'text-gray-400'}`}>
                      {item.name}
                    </div>
                    <div className="text-gray-300 mb-2 leading-relaxed">
                      {item.desc}
                    </div>
                    <div className={`font-mono text-[10px] uppercase tracking-widest ${isUnlocked ? 'text-[#39FF14]' : 'text-[#FF4500]'}`}>
                      {isUnlocked ? '✓ KULLANIMA AÇIK' : `🔒 KİLİDİ AÇMAK İÇİN LEVEL ${item.reqLevel} GEREKİR`}
                    </div>
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
