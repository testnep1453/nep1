import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Student } from '../../types/student';
import { checkRateLimit, recordAction, formatCooldown } from '../../services/rateLimitService';
import { sendVerificationLink } from '../../services/authService';

interface ProfileModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

// AÇIK KAYNAKLI ALGORİTMA STİLLERİ (DiceBear)
const AVATAR_STYLES = [
  { id: 'bottts', name: 'Robot' },
  { id: 'adventurer', name: 'Ajan' },
  { id: 'pixel-art', name: 'Retro' },
  { id: 'avataaars', name: 'Sivil' },
  { id: 'micah', name: 'Çizgi Roman' },
];

export const ProfileModal = ({ student, isOpen, onClose, theme, onThemeChange }: ProfileModalProps) => {
  const [nickname, setNickname] = useState(student.nickname || '');
  const [savingNickname, setSavingNickname] = useState(false);
  const [nickMsg, setNickMsg] = useState('');

  // Avatar Stüdyosu State'leri
  const initialStyle = (student.avatar && student.avatar.includes(':')) ? student.avatar.split(':')[0] : (student.avatar || 'bottts');
  const initialSeed = (student.avatar && student.avatar.includes(':')) ? student.avatar.split(':')[1] : student.id;

  const [selectedStyle, setSelectedStyle] = useState(initialStyle);
  const [selectedSeed, setSelectedSeed] = useState(initialSeed);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailCooldown, setEmailCooldown] = useState('');
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

  // ZAR AT: Yeni bir rastgele şifre oluşturur, yüz anında değişir!
  const handleRandomize = () => {
    const randomSeed = Math.random().toString(36).substring(2, 10);
    setSelectedSeed(randomSeed);
  };

  const handleSaveAvatar = async () => {
    const newAvatar = `${selectedStyle}:${selectedSeed}`;
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

  const previewUrl = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${selectedSeed}&backgroundColor=transparent`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 bg-[#0A1128] border-2 border-[#00F0FF]/40 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.15)] p-6 sm:p-8 z-10 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-xl font-black text-[#00F0FF] uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">AJAN AYARLARI</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-[#FF4500] flex items-center justify-center transition-colors">✕</button>
        </div>

        {/* 🎮 AVATAR STÜDYOSU (KAHOOT TARZI) */}
        <div className="mb-10 bg-black/40 p-4 sm:p-6 rounded-2xl border border-[#00F0FF]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#00F0FF]/10 text-[#00F0FF] text-[10px] px-2 py-1 font-bold tracking-widest rounded-bl-lg">
            AVATAR STÜDYOSU
          </div>
          
          <div className="flex flex-col items-center">
            {/* Canlı Önizleme Çerçevesi */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-4 border-[#00F0FF]/60 bg-gradient-to-b from-[#00F0FF]/20 to-black shadow-[0_0_20px_rgba(0,240,255,0.3)] mb-4 p-2 relative group">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
              {/* Zar At Butonu (Resmin Üstünde) */}
              <button 
                onClick={handleRandomize} 
                className="absolute -bottom-3 -right-3 bg-[#FF9F43] hover:bg-[#FF4500] text-black w-12 h-12 rounded-full flex items-center justify-center text-2xl border-4 border-[#0A1128] transition-transform hover:scale-110 hover:rotate-180 shadow-lg z-10"
                title="Rastgele Yüz Üret!"
              >
                🎲
              </button>
            </div>

            <p className="text-gray-400 text-xs text-center mb-4 max-w-[250px]">
              Tarzını seç ve zarlara basarak kendine en uygun benzersiz ajan yüzünü yarat!
            </p>

            {/* Sınıf Seçici */}
            <div className="grid grid-cols-5 gap-2 w-full mb-4">
              {AVATAR_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`text-[10px] sm:text-xs font-bold py-2 rounded-lg border transition-all ${
                    selectedStyle === style.id 
                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)] scale-105' 
                      : 'bg-black/50 border-gray-800 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>

            {/* Kaydet Butonu */}
            <button
              onClick={handleSaveAvatar}
              disabled={savingAvatar || `${selectedStyle}:${selectedSeed}` === student.avatar}
              className="w-full py-3 bg-[#39FF14]/20 hover:bg-[#39FF14]/30 text-[#39FF14] border border-[#39FF14]/40 font-black tracking-widest uppercase rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {savingAvatar ? 'KAYDEDİLİYOR...' : `${selectedStyle}:${selectedSeed}` === student.avatar ? '✓ AVATAR AKTİF' : 'KARAKTERİ ONAYLA'}
            </button>
          </div>
        </div>

        {/* NICKNAME VE TEMA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-gray-400 text-xs uppercase tracking-wider block">Takma Ad (Nickname)</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} className="w-full bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#00F0FF] transition-colors font-mono" />
            <button onClick={handleSaveNickname} disabled={savingNickname || !nickname.trim()} className="w-full py-2 bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/40 rounded-lg text-sm font-semibold hover:bg-[#00F0FF]/30 transition-all disabled:opacity-40">
              {savingNickname ? '...' : 'Kaydet'}
            </button>
            {nickMsg && <p className="text-xs text-[#39FF14] text-center">{nickMsg}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-xs uppercase tracking-wider block">Sistem Teması</label>
            <div className="flex flex-col gap-2">
              <button onClick={() => onThemeChange('dark')} className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${theme === 'dark' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'}`}>
                🌙 Gece Operasyonu
              </button>
              <button onClick={() => onThemeChange('light')} className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${theme === 'light' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'}`}>
                ☀️ Gündüz Modu
              </button>
            </div>
          </div>
        </div>

        {/* E-POSTA GÜVENLİĞİ */}
        <div className="space-y-2 border-t border-gray-800 pt-6">
          <label className="text-gray-400 text-xs uppercase tracking-wider block">Güvenlik Bağlantısı (E-posta)</label>
          <p className="text-white/70 text-sm font-mono mb-2">{student.email || 'Kayıtlı e-posta yok'}</p>

          {!showEmailChange ? (
            <button onClick={() => setShowEmailChange(true)} className="text-xs text-gray-500 hover:text-white transition-colors underline">
              E-postayı güncelle
            </button>
          ) : (
            <div className="space-y-2 mt-2">
              {emailStep === 'input' ? (
                <div className="flex gap-2">
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="yeni@eposta.com" className="flex-1 bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#FF4500] transition-colors" />
                  <button onClick={handleSendEmailCode} disabled={savingEmail} className="px-4 py-2 bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/30 rounded-lg text-sm font-semibold hover:bg-[#FF4500]/20 transition-all disabled:opacity-40">
                    {savingEmail ? '...' : 'İste'}
                  </button>
                </div>
              ) : (
                <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-[#39FF14]">✅ {emailMsg}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
