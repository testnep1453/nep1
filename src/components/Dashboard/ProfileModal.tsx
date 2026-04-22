import { useState } from 'react';
import { Student } from '../../types/student';
import { Dices } from 'lucide-react';
import { updateStudent } from '../../services/supabaseService';

interface ProfileModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

const STYLES = [
  { id: 'avataaars', name: 'Ajan' },
  { id: 'bottts', name: 'Siber' },
  { id: 'pixel-art', name: 'Retro' },
  { id: 'identicon', name: 'Kod' }
];

export const ProfileModal = ({ student, isOpen, onClose, theme, onThemeChange }: ProfileModalProps) => {
  const [nickname, setNickname] = useState(student.nickname || '');
  const [saving, setSaving] = useState(false);

  const getInitialAvatar = () => {
    if (student.avatar && student.avatar.includes(':')) {
      const parts = student.avatar.split(':');
      const st = STYLES.find(s => s.id === parts[0]) ? parts[0] : 'avataaars';
      return { style: st, seed: parts[1] || student.id };
    }
    return { style: 'avataaars', seed: student.id };
  };

  const [selectedStyle, setSelectedStyle] = useState(getInitialAvatar().style);
  const [selectedSeed, setSelectedSeed] = useState(getInitialAvatar().seed);

  const handleRandomize = () => {
    setSelectedSeed(Math.random().toString(36).substring(2, 10));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newAvatar = `${selectedStyle}:${selectedSeed}`;
      await updateStudent(student.id, {
        avatar: newAvatar,
        nickname: nickname.trim()
      });
      student.avatar = newAvatar;
      student.nickname = nickname.trim();
      onClose();
    } catch {
      alert('Ayarlar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // DiceBear v9 — avataaars için sadece geçerli tekil değerler kullan
  // Virgülle ayrılmış çoklu değerler 400 hatası verir
  let previewUrl = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${encodeURIComponent(selectedSeed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  if (selectedStyle === 'avataaars') {
    previewUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(selectedSeed)}&backgroundColor=b6e3f4&top=shortHairShortFlat&facialHairProbability=0&clothing=hoodie`;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0A1128] border-2 border-[#00F0FF]/30 rounded-3xl p-6 md:p-8 w-full max-w-md animate-fade-in shadow-2xl">
        <h2 className="text-[#00F0FF] font-black uppercase tracking-widest text-center mb-6">Ajan Kimlik Ayarları</h2>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-2xl border-4 border-[#00F0FF]/50 bg-gradient-to-b from-slate-100 to-slate-300 p-2 mb-4 relative shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <img
              src={previewUrl}
              alt="Avatar Önizleme"
              className="w-full h-full object-contain drop-shadow-xl"
              onError={(e) => {
                // Yükleme başarısız olursa placeholder göster
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <button
              onClick={handleRandomize}
              aria-label="Rastgele avatar oluştur"
              className="absolute -bottom-3 -right-3 bg-[#FF9F43] p-2.5 rounded-full border-4 border-[#0A1128] hover:scale-110 transition-transform shadow-lg"
            >
              <Dices className="w-5 h-5 text-black" />
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2 w-full mb-6">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStyle(s.id)}
                className={`py-2 text-[11px] font-bold rounded-lg border transition-all ${selectedStyle === s.id ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-sm' : 'bg-black/50 border-gray-800 text-gray-500 hover:text-gray-300'}`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="w-full space-y-5">
            {/* FIX: label htmlFor ile input id eşleşiyor */}
            <div>
              <label htmlFor="profile-nickname" className="text-gray-500 text-[10px] uppercase font-bold mb-1.5 block">
                Ajan Takma Adı
              </label>
              <input
                id="profile-nickname"
                name="profile-nickname"
                autoComplete="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="Takma adını gir"
                className="w-full bg-[#050505] border border-gray-700 focus:border-[#00F0FF] outline-none text-white px-4 py-2 rounded-xl font-mono text-sm transition-colors"
              />
            </div>

            <div>
              <label htmlFor="themeSelect" className="text-gray-500 text-[10px] uppercase font-bold mb-1.5 block">
                Arayüz Rengi
              </label>
              {/* Tema seçimi buton grubu — label field ilişkisi için fieldset kullanıldı */}
              <fieldset id="themeSelect" className="border-0 p-0 m-0">
                <legend className="sr-only">Tema seçimi</legend>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onThemeChange('dark')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-white/5 text-gray-500 border border-gray-700'}`}
                  >
                    Gece
                  </button>
                  <button
                    type="button"
                    onClick={() => onThemeChange('light')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'light' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-white/5 text-gray-500 border border-gray-700'}`}
                  >
                    Gündüz
                  </button>
                </div>
              </fieldset>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 bg-[#39FF14]/20 hover:bg-[#39FF14]/30 text-[#39FF14] font-black uppercase tracking-widest py-3 rounded-xl border border-[#39FF14]/40 transition-all disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Onayla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



