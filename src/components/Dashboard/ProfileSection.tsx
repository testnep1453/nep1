import { useState } from 'react';
import { Student } from '../../types/student';
import { Shield, Lock, Unlock, Zap } from 'lucide-react';
import { updateNickname } from '../../services/dbFirebase';

interface ProfileSectionProps {
  student: Student;
  isAdmin?: boolean;
}

const INVENTORY_ITEMS = [
  { id: 'item_1', name: 'Taktik Kulaklık', reqLevel: 1, icon: '🎧', desc: 'İletişim.' },
  { id: 'item_2', name: 'Siber Tablet', reqLevel: 2, icon: '📱', desc: 'Hack Cihazı.' },
  { id: 'item_3', name: 'Gece Görüşü', reqLevel: 4, icon: '🕶️', desc: 'Gece Netliği.' },
  { id: 'item_4', name: 'Lazer Kesici', reqLevel: 6, icon: '🔦', desc: 'Kapı Kesici.' },
  { id: 'item_5', name: 'EMP Bombası', reqLevel: 8, icon: '💣', desc: 'Ağ Çökertici.' },
  { id: 'item_6', name: 'Hayalet Pelerini', reqLevel: 10, icon: '🥷', desc: 'Görünmezlik.' },
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
      alert('Hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Basit, Hızlı ve Otomatik Avatar
  const avatarData = student.avatar || `bottts:${student.id}`;
  const [style, seed] = avatarData.split(':');
  const dicebearUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=transparent`;

  return (
    <div className="bg-gradient-to-br from-[#1a1d2e] to-[#0A1128] rounded-xl p-4 sm:p-5 border border-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.1)] w-full flex-1 flex flex-col justify-center">
      
      {/* Üst Kısım: Profil */}
      <div className="flex flex-row items-center gap-4 sm:gap-6 mb-4">
        
        <div className="relative shrink-0 group">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-[#00F0FF]/50 shadow-lg bg-[#050505] flex items-center justify-center relative">
            <img src={dicebearUrl} alt="Ajan" className="w-full h-full object-contain p-1.5 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#00F0FF] rounded-md px-2 py-0.5 flex items-center justify-center border border-[#0A1128] text-[#0A1128] font-black text-xs z-10 shadow-lg">
            LVL {student.level}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider truncate mb-1">{student.name}</h2>
          {isEditingNickname ? (
            <div className="flex items-center gap-2">
              <input type="text" value={nicknameValue} onChange={(e) => setNicknameValue(e.target.value)} maxLength={20} autoFocus className="bg-[#050505] border border-[#00F0FF] text-[#00F0FF] px-2 py-1 text-sm rounded font-mono focus:outline-none w-full max-w-[150px]" />
              <button onClick={handleSaveNickname} disabled={saving} className="text-[#39FF14] text-sm font-bold bg-[#39FF14]/10 px-2 py-1 rounded">{saving ? '...' : '✓'}</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-[#00F0FF] font-mono tracking-widest text-sm font-bold truncate">» {student.nickname || 'AJAN'} «</div>
              <button onClick={() => setIsEditingNickname(true)} className="text-gray-600 hover:text-[#00F0FF] transition-colors">✏️</button>
            </div>
          )}
          {!isAdmin && (
            <div className="flex items-center gap-2 mt-2 bg-white/5 inline-flex px-3 py-1 rounded-md border border-white/10">
              <Zap className="w-4 h-4 text-[#39FF14]" fill="#39FF14" />
              <span className="text-gray-300 text-xs font-mono">XP: <span className="text-[#39FF14] font-bold text-sm">{student.xp}</span></span>
            </div>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="flex flex-col gap-4">
          {/* İlerleme Çubuğu */}
          <div className="bg-black/40 p-3 rounded-lg border border-gray-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">Sonraki Level Hedefi</span>
              <span className="text-[#00F0FF] text-[10px] font-mono font-bold">{student.xp % 200} / {xpForNextLevel} XP</span>
            </div>
            <div className="h-2 bg-[#050505] rounded-full overflow-hidden border border-gray-800">
              <div className="h-full bg-gradient-to-r from-[#00F0FF] to-[#39FF14] rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>

          {/* Envanter (Taşmaması için sıkıştırıldı) */}
          <div>
            <h3 className="text-gray-400 font-bold mb-2 uppercase tracking-widest flex items-center gap-2 text-[10px] sm:text-xs">
              <Shield className="w-3 h-3 text-[#00F0FF]" /> KİLİDİ AÇILAN TEÇHİZATLAR
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {INVENTORY_ITEMS.map((item) => {
                const isUnlocked = student.level >= item.reqLevel;
                return (
                  <div key={item.id} className={`relative aspect-square rounded-lg border flex items-center justify-center transition-all ${isUnlocked ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40 shadow-sm' : 'bg-black/50 border-gray-800 opacity-40'}`}>
                    <div className="text-2xl sm:text-3xl">{item.icon}</div>
                    {!isUnlocked && <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-gray-600" />}
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
