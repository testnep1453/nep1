import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Student } from '../../types/student';
import { checkRateLimit, recordAction, formatCooldown } from '../../services/rateLimitService';
import { sendVerificationLink } from '../../services/authService';
import { Glasses, Dices, Headset, Crown, Bot, ExternalLink } from 'lucide-react';

interface ProfileModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

// 1. YASAL VE AÇIK KAYNAKLI ALGORİTMA STİLLERİ
const AVATAR_STYLES = [
  { id: 'bottts', name: 'Robot Class', icon: <Bot className="w-4 h-4" /> },
  { id: 'adventurer', name: 'Agent Class', icon: <Shield className="w-4 h-4 text-[#00F0FF]" /> },
  { id: 'pixel-art', name: 'Retro Class', icon: <Zap className="w-4 h-4 text-[#39FF14]" /> },
  { id: 'micah', name: 'Comic Class', icon: <Crown className="w-4 h-4 text-[#FF9F43]" /> },
];

// 2. NEP'E ÖZEL, YEREL AKSESUAR KİTİ (Giydirme Simülasyonu)
const LOCAL_ACCESSORIES = [
  { id: 'acc_1', name: 'Taktik Gözlük', style: 'adventurer', icon: <Glasses /> },
  { id: 'acc_2', name: 'Siber Kulaklık', style: 'bottts', icon: <Headset /> },
  // Buraya ileride daha fazla YASAL aksesuar eklenebilir.
];

export const ProfileModal = ({ student, isOpen, onClose, theme, onThemeChange }: ProfileModalProps) => {
  const [nickname, setNickname] = useState(student.nickname || '');
  const [savingNickname, setSavingNickname] = useState(false);
  const [nickMsg, setNickMsg] = useState('');

  // Avatar Stüdyosu State'leri (Firebase formatı -> style:seed:acc1,acc2)
  const parseAvatarData = (data: string | undefined) => {
    if (!data) return { style: 'bottts', seed: student.id, accs: [] };
    const parts = data.split(':');
    return {
      style: parts[0] || 'bottts',
      seed: parts[1] || student.id,
      accs: parts[2] ? parts[2].split(',') : []
    };
  };

  const initialAvatarData = parseAvatarData(student.avatar);
  const [selectedStyle, setSelectedStyle] = useState(initialAvatarData.style);
  const [selectedSeed, setSelectedSeed] = useState(initialAvatarData.seed);
  const [selectedAccs, setSelectedAccs] = useState<string[]>(initialAvatarData.accs);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
  const [emailMsg, setEmailMsg] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const handleSaveNickname = async () => {
    if (!nickname.trim() || nickname === student.nickname) return;
    const { allowed, remainingMs } = await checkRateLimit('nicknameChange');
    if (!allowed) { setNickMsg(`Çok sık değiştirilemez. ${formatCooldown(remainingMs)} bekleyin.`); return; }
    
    setSavingNickname(true);
    try {
      await updateDoc(doc(db, 'students', student.id), { nickname: nickname.trim() });
      await recordAction('nicknameChange');
      setNickMsg('Nickname güncellendi! ✅');
      setTimeout(() => setNickMsg(''), 3000);
    } catch { setNickMsg('Güncelleme başarısız.'); }
    setSavingNickname(false);
  };

  const handleRandomize = () => {
    const randomSeed = Math.random().toString(36).substring(2, 10);
    setSelectedSeed(randomSeed);
  };

  const handleToggleAccessory = (accId: string) => {
    setSelectedAccs(prev => 
      prev.includes(accId) ? prev.filter(id => id !== accId) : [...prev, accId]
    );
  };

  const handleSaveAvatar = async () => {
    const accPart = selectedAccs.length > 0 ? `:${selectedAccs.join(',')}` : '';
    const newAvatar = `${selectedStyle}:${selectedSeed}${accPart}`;
    if (newAvatar === student.avatar) return;

    setSavingAvatar(true);
    try {
      await updateDoc(doc(db, 'students', student.id), { avatar: newAvatar });
      student.avatar = newAvatar; // Local update
    } catch (err) {
      console.error("Avatar kaydedilemedi", err);
    }
    setSavingAvatar(false);
  };

  if (!isOpen) return null;

  // Canlı SVG URL'si (Açıklama: Aksesuarlar henüz api.dicebear tarafından desteklenmiyor,
  // bu yüzden yerel 'giydirme' simülasyonunu sadece önizlemede SVG'nin üzerine giydireceğiz).
  const dicebearUrl = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${selectedSeed}&backgroundColor=transparent`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl mx-4 bg-[#0A1128] border-2 border-[#00F0FF]/40 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.15)] p-6 sm:p-8 z-10 animate-fade-in max-h-[95vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4 shrink-0">
          <h2 className="text-xl font-black text-[#00F0FF] uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">AJAN STÜDYOSU</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-[#FF4500] flex items-center justify-center transition-colors">✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* 🎮 CANLI ÖNİZLEME VE KAYDET (SOL TARAF) */}
          <div className="lg:col-span-5 flex flex-col items-center bg-black/40 p-5 rounded-2xl border border-white/5 relative">
            
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl border-4 border-[#00F0FF]/60 bg-gradient-to-b from-[#00F0FF]/20 to-black shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-6 p-2 relative group flex items-center justify-center">
              <img src={dicebearUrl} alt="Preview" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
              
              {/* YEREL GİYDİRME SİMÜLASYONU (Açıklama: SVG'nin üzerine yerel kıyafetleri yerleştirme kodu buraya gelecek) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {selectedAccs.includes('acc_1') && <Glasses className="w-16 h-16 text-white absolute top-10" />}
                {selectedAccs.includes('acc_2') && <Headset className="w-20 h-20 text-white absolute" />}
              </div>

              <button 
                onClick={handleRandomize} 
                className="absolute -bottom-4 -right-4 bg-[#FF9F43] hover:bg-[#FF4500] text-black w-14 h-14 rounded-full flex items-center justify-center border-4 border-[#0A1128] transition-transform hover:scale-110 hover:rotate-180 shadow-lg z-10"
                title="Yüzü Rastgele Değiştir!"
              >
                <Dices className="w-7 h-7" />
              </button>
            </div>

            <button
              onClick={handleSaveAvatar}
              disabled={savingAvatar || `${selectedStyle}:${selectedSeed}${selectedAccs.length > 0 ? `:${selectedAccs.join(',')}` : ''}` === student.avatar}
              className="w-full py-4 bg-[#39FF14]/20 hover:bg-[#39FF14]/30 text-[#39FF14] border-2 border-[#39FF14]/40 font-black tracking-widest uppercase rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm shadow-[0_0_15px_rgba(57,255,20,0.2)]"
            >
              {savingAvatar ? 'KİMLİK KAYDEDİLİYOR...' : 'KİMLİĞİ ONAYLA'}
            </button>
          </div>

          {/* 🛠️ GİYDİRME KİTİ VE AYARLAR (SAĞ TARAF) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* YÖNLENDİRME BUTONU (Dış Editörü Aç) */}
            <div className="bg-[#FF9F43]/5 border border-[#FF9F43]/30 p-4 rounded-xl flex items-center justify-between gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF9F43]/10 to-transparent"></div>
                <div className="flex-1 z-10 relative">
                    <p className="text-[#FF9F43] font-bold text-sm mb-0.5">Daha Fazla Kıyafet İster Misin?</p>
                    <p className="text-gray-400 text-[10px] leading-snug">"Avatar Maker Dress up" uygulamasının resmi web sitesini yeni sekmede açarak tam giydirme özelliğini kullanabilirsin.</p>
                </div>
                <a href="https://www.pazugames.com/" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF9F43]/20 text-[#FF9F43] font-bold text-xs border border-[#FF9F43]/40 hover:bg-[#FF9F43]/30 transition-colors z-10">
                    DIŞ EDİTÖR <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>

            {/* Sınıf Seçici */}
            <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
              <label className="text-gray-400 text-xs uppercase tracking-wider block mb-3 font-bold">Ajan Sınıfı Seç</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                {AVATAR_STYLES.map(style => (
                  <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={`flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg border transition-all ${selectedStyle === style.id ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)] scale-105' : 'bg-black/50 border-gray-800 text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}>
                    {style.icon} {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* YEREL AKSESUAR KİTİ (Giydirme Simülasyonu) */}
            <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                <label className="text-gray-400 text-xs uppercase tracking-wider block mb-3 font-bold">NEP Aksesuar Kiti (Giydirme)</label>
                <div className="grid grid-cols-4 gap-2 w-full">
                    {LOCAL_ACCESSORIES.map(acc => {
                        const isSelected = selectedAccs.includes(acc.id);
                        return (
                            <button key={acc.id} onClick={() => handleToggleAccessory(acc.id)} className={`aspect-square flex items-center justify-center py-2.5 rounded-lg border transition-all ${isSelected ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.3)] scale-105' : 'bg-black/50 border-gray-800 text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}>
                                <div className="text-3xl text-white opacity-90">{acc.icon}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* NICKNAME VE TEMA (Alt Kısma Taşındı) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded-xl border border-gray-800 space-y-2">
                    <label className="text-gray-400 text-xs uppercase tracking-wider block font-bold">Takma Ad (Nickname)</label>
                    <div className="flex gap-2">
                        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} className="flex-1 bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#00F0FF] transition-colors font-mono" />
                        <button onClick={handleSaveNickname} disabled={savingNickname || !nickname.trim()} className="px-4 py-2 bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/40 rounded-lg text-sm font-semibold hover:bg-[#00F0FF]/30 transition-all disabled:opacity-40">
                        {savingNickname ? '...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-gray-800 space-y-2">
                    <label className="text-gray-400 text-xs uppercase tracking-wider block font-bold">Sistem Teması</label>
                    <div className="flex gap-2">
                        <button onClick={() => onThemeChange('dark')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${theme === 'dark' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'}`}>🌙 Gece Ops</button>
                        <button onClick={() => onThemeChange('light')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${theme === 'light' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'}`}>☀️ Gündüz</button>
                    </div>
                </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
