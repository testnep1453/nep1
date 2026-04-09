import { useState } from 'react';
import { Student } from '../../types/student';
import { Shield, Lock, Unlock, Zap } from 'lucide-react';
import { updateNickname } from '../../services/dbFirebase';

interface ProfileSectionProps {
  student: Student;
  isAdmin?: boolean;
}

// ENVANTER SİSTEMİ
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

  // Avatarı Ayrıştırma Mantığı (Style ve Rastgelelik Kodu)
  let avatarStyle = 'bottts';
  let avatarSeed = student.id;

  if (student.avatar && student.avatar.includes(':')) {
    const parts = student.avatar.split(':');
    avatarStyle = parts[0];
    avatarSeed = parts[1];
  } else if (student.avatar) {
    avatarStyle = student.avatar;
  }

  const dicebearUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${avatarSeed}&backgroundColor=transparent`;

  return (
    <div className="bg-gradient-to-br from-[#1a1d2e] to-[#0A1128] rounded-2xl p-6 sm:p-8 border border-[#00F0FF]/30 shadow-[0_0_30px_rgba(0,240,255,0.1)] w-full">
      
      {/* ÜST KISIM: Profil Bilgileri */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-8 text-center sm:text-left">
        <div className="relative shrink-0 group">
          {/* Benzersiz Kahoot Tarzı Avatar */}
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-[#00F0FF]/50 shadow-[0_0_20px_rgba(0,240,255,0.4)] bg-[#050505] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#00F0FF]/20 to-transparent opacity-50"></div>
            <img 
              src={dicebearUrl} 
              alt="Ajan Avatar" 
              className="w-full h-full object-contain p-2 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 bg-[#00F0FF] rounded-lg px-3 py-1.5 flex items-center justify-center border-2 border-[#0A1128] shadow-lg text-[#0A1128] font-black text-sm z-10">
            LVL {student.level}
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-2">
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider truncate mb-2 drop-shadow-lg">
            {student.name}
          </h2>

          {isEditingNickname ? (
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <input
                type="text"
                value={nicknameValue}
                onChange={(e) => setNicknameValue(e.target.value)}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                className="bg-[#050505] border border-[#00F0FF] text-[#00F0FF] px-3 py-2 text-sm rounded font-mono focus:outline-none w-full max-w-[200px]"
                placeholder="Takma adın..."
              />
              <button onClick={handleSaveNickname} disabled={saving} className="text-[#39FF14] text-lg font-bold bg-[#39FF14]/10 px-3 py-1.5 rounded">
                {saving ? '...' : '✓'}
              </button>
              <button onClick={() => { setIsEditingNickname(false); setNicknameValue(student.nickname || ''); }} className="text-[#FF4500] text-lg font-bold bg-[#FF4500]/10 px-3 py-1.5 rounded">
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {student.nickname ? (
                <div className="text-[#00F0FF] font-mono tracking-widest text-lg drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] font-bold">
                  » {student.nickname} «
                </div>
              ) : (
                <span className="text-gray-500 text-sm italic font-mono">Gizli Kod (Takma Ad) Belirle</span>
              )}
              <button onClick={() => setIsEditingNickname(true)} className="text-gray-500 hover:text-[#00F0FF] transition-colors ml-3 text-lg" title="Takma adını düzenle">
                ✏️
              </button>
            </div>
          )}

          {!isAdmin && (
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-4 bg-white/5 inline-flex px-4 py-2 rounded-lg border border-white/10">
              <Zap className="w-5 h-5 text-[#39FF14]" fill="#39FF14" />
              <span className="text-gray-300 text-base font-mono">
                Kazanılan XP: <span className="text-[#39FF14] font-bold text-xl">{student.xp}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ORTA KISIM: İlerleme Çubuğu */}
      {!isAdmin && (
        <div className="mb-10 bg-black/40 p-4 rounded-xl border border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-xs font-mono tracking-widest">SONRAKİ SEVİYE HEDEFİ</span>
            <span className="text-[#00F0FF] text-sm font-mono font-bold">
              {student.xp % 200} / {xpForNextLevel} XP
            </span>
          </div>
          <div className="h-3 bg-[#050505] rounded-full overflow-hidden border border-gray-800 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#00F0FF] to-[#39FF14] rounded-full transition-all duration-1000 relative"
              style={{ width: `${xpProgress}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1.5rem_1.5rem] animate-[pan_1s_linear_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* ALT KISIM: Ajan Envanteri */}
      {!isAdmin && (
        <div>
          <h3 className="text-gray-300 font-bold mb-4 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2 text-base border-b border-gray-800 pb-3">
            <Shield className="w-5 h-5 text-[#00F0FF]" />
            KİLİDİ AÇILAN TEÇHİZATLAR
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {INVENTORY_ITEMS.map((item) => {
              const isUnlocked = student.level >= item.reqLevel;
              return (
                <div
                  key={item.id}
                  className={`group relative aspect-square rounded-xl border-2 transition-all flex items-center justify-center cursor-help
                    ${isUnlocked 
                      ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:bg-[#00F0FF]/30 hover:scale-105' 
                      : 'bg-black/50 border-gray-800 opacity-50 hover:opacity-80'}`}
                >
                  <div className={`text-4xl sm:text-3xl md:text-4xl transition-transform ${isUnlocked ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'grayscale'}`}>
                    {item.icon}
                  </div>
                  
                  {!isUnlocked && (
                    <div className="absolute top-2 right-2 text-gray-500 bg-black/80 rounded-full p-1">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                  {isUnlocked && (
                    <div className="absolute top-2 right-2 text-[#39FF14] bg-black/80 rounded-full p-1">
                      <Unlock className="w-3 h-3" />
                    </div>
                  )}

                  <div className="absolute w-56 bottom-full left-1/2 -translate-x-1/2 mb-3 p-4 bg-[#0A1128] border-2 border-[#00F0FF]/60 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 shadow-2xl pointer-events-none">
                    <div className={`font-bold mb-2 text-base ${isUnlocked ? 'text-[#00F0FF]' : 'text-gray-400'}`}>
                      {item.name}
                    </div>
                    <div className="text-gray-300 mb-3 leading-relaxed text-sm">
                      {item.desc}
                    </div>
                    <div className={`font-mono text-xs font-bold uppercase tracking-widest bg-black/50 p-2 rounded ${isUnlocked ? 'text-[#39FF14]' : 'text-[#FF4500]'}`}>
                      {isUnlocked ? '✓ ENVANTERE EKLENDİ' : `🔒 LEVEL ${item.reqLevel} GEREKLİ`}
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
