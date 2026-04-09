import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Student } from '../../types/student';

interface ProfileModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

export const ProfileModal = ({ student, isOpen, onClose, theme, onThemeChange }: ProfileModalProps) => {
  const [nickname, setNickname] = useState(student.nickname || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'students', student.id), { 
        nickname: nickname.trim() 
      });
      student.nickname = nickname.trim();
      onClose();
    } catch {
      alert('Ayarlar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0A1128] border-2 border-[#00F0FF]/30 rounded-3xl p-6 md:p-8 w-full max-w-sm animate-fade-in shadow-2xl">
        <h2 className="text-[#00F0FF] font-black uppercase tracking-widest text-center mb-6">Ajan Ayarları</h2>
        
        <div className="w-full space-y-6">
          <div>
            <label className="text-gray-500 text-[10px] uppercase font-bold mb-2 block">Ajan Takma Adı</label>
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              maxLength={20} 
              className="w-full bg-[#050505] border border-gray-700 focus:border-[#00F0FF] outline-none text-white px-4 py-3 rounded-xl font-mono text-sm transition-colors" 
            />
          </div>

          <div>
            <label className="text-gray-500 text-[10px] uppercase font-bold mb-2 block">Arayüz Rengi (Tema)</label>
            <div className="flex gap-2">
              <button 
                onClick={() => onThemeChange('dark')} 
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 shadow-sm' : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'}`}
              >
                Gece Modu
              </button>
              <button 
                onClick={() => onThemeChange('light')} 
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${theme === 'light' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 shadow-sm' : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'}`}
              >
                Gündüz Modu
              </button>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full mt-2 bg-[#39FF14]/20 hover:bg-[#39FF14]/30 text-[#39FF14] font-black uppercase tracking-widest py-3 rounded-xl border border-[#39FF14]/40 transition-all disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Onayla'}
          </button>
        </div>
      </div>
    </div>
  );
};
