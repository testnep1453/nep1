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
  { id: 'bottts', name: 'Siber Robot' },
  { id: 'adventurer', name: 'Gizli Ajan' },
  { id: 'pixel-art', name: 'Retro 8-Bit' },
  { id: 'avataaars', name: 'Sivil Görünüm' },
  { id: 'micah', name: 'El Çizimi' },
  { id: 'lorelei', name: 'Kozmik' },
  { id: 'notionists', name: 'Karikatür' },
  { id: 'rings', name: 'Hologram' }
];

export const ProfileModal = ({ student, isOpen, onClose, theme, onThemeChange }: ProfileModalProps) => {
  const [nickname, setNickname] = useState(student.nickname || '');
  const [savingNickname, setSavingNickname] = useState(false);
  const [nickMsg, setNickMsg] = useState('');
  
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
    if (!allowed) {
      setNickMsg(`Çok sık değiştirilemez. ${formatCooldown(remainingMs)} bekleyin.`);
      return;
    }

    setSavingNickname(true);
    try {
      await updateDoc(doc(db, 'students', student.id), { nickname: nickname.trim() });
      await recordAction('nicknameChange');
      setNickMsg('Nickname güncellendi! ✅');
      setTimeout(() => setNickMsg(''), 3000);
    } catch {
      setNickMsg('Güncelleme başarısız.');
    }
    setSavingNickname(false);
  };

  const handleAvatarSelect = async (styleId: string) => {
    if (styleId === student.avatar) return;
    
    setSavingAvatar(true);
    try {
      await updateDoc(doc(db, 'students', student.id), { avatar: styleId });
      student.avatar = styleId; // Local update
    } catch (err) {
      console.error("Avatar kaydedilemedi", err);
    }
    setSavingAvatar(false);
  };

  const handleSendEmailCode = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailMsg('Geçerli bir e-posta girin.');
      return;
    }

    const { allowed, remainingMs } = await checkRateLimit('emailChange');
    if (!allowed) {
      setEmailCooldown(formatCooldown(remainingMs));
      setEmailMsg(`E-posta değiştirme cooldown'da. ${formatCooldown(remainingMs)} bekleyin.`);
      return;
    }

    setSavingEmail(true);
    try {
      await sendVerificationLink(newEmail, student.id);
      setEmailStep('verify');
      setEmailMsg('Doğrulama linki gönderildi! E-postanı kontrol et.');
      await recordAction('emailChange');
    } catch {
      setEmailMsg('E-posta gönderilemedi.');
    }
    setSavingEmail(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 bg-[#0A1128] border border-[#00F0FF]/40 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-lg font-bold text-[#00F0FF] uppercase tracking-widest">Ajan Ayarları</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors">✕</button>
        </div>

        {/* Profil Fotoğrafı (Açık Kaynak Avatar) Seçimi */}
        <div className="mb-8">
          <label className="text-gray-400 text-xs uppercase tracking-wider block mb-3">
            Algoritmik Avatar Tarzı
            <span className="block text-[10px] text-gray-500 normal-case mt-1 tracking-normal">Kimliğine özel (ID: {student.id}) yüzün farklı evrenlerde nasıl görünür?</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_STYLES.map(style => {
              // Ajanın ID'sine göre sadece ona özel üretilen önizleme URL'si
              const previewUrl = `https://api.dicebear.com/9.x/${style.id}/svg?seed=${student.id}&backgroundColor=transparent`;
              const isActive = student.avatar === style.id || (!student.avatar && style.id === 'bottts');

              return (
                <button
                  key={style.id}
                  onClick={() => handleAvatarSelect(style.id)}
                  disabled={savingAvatar}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-[#050505] flex items-center justify-center ${
                    isActive
                      ? 'border-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.3)] scale-105'
                      : 'border-gray-800 opacity-60 hover:opacity-100 hover:border-gray-500'
                  }`}
                  title={style.name}
                >
                  <img src={previewUrl} alt={style.name} className="w-full h-full object-contain p-1" />
                  
                  {/* Tarz İsim Etiketi */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[8px] font-bold text-center py-0.5 truncate px-1">
                    {style.name}
                  </div>

                  {isActive && (
                    <div className="absolute top-0 right-0 bg-[#39FF14] text-black text-[8px] font-bold px-1 rounded-bl">✓</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nickname */}
        <div className="space-y-2 mb-6">
          <label className="text-gray-400 text-xs uppercase tracking-wider block">Takma Ad (Nickname)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="flex-1 bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#00F0FF] transition-colors font-mono"
            />
            <button
              onClick={handleSaveNickname}
              disabled={savingNickname || !nickname.trim()}
              className="px-4 py-2 bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/40 rounded-lg text-sm font-semibold hover:bg-[#00F0FF]/30 transition-all disabled:opacity-40"
            >
              {savingNickname ? '...' : 'Kaydet'}
            </button>
          </div>
          {nickMsg && <p className="text-xs text-[#39FF14]">{nickMsg}</p>}
        </div>

        {/* Tema Seçimi */}
        <div className="space-y-2 mb-6">
          <label className="text-gray-400 text-xs uppercase tracking-wider block">Sistem Arayüzü (Tema)</label>
          <div className="flex gap-2">
            <button onClick={() => onThemeChange('dark')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${theme === 'dark' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'}`}>
              🌙 Gece Operasyonu
            </button>
            <button onClick={() => onThemeChange('light')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${theme === 'light' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'}`}>
              ☀️ Gündüz Modu
            </button>
          </div>
        </div>

        {/* E-posta */}
        <div className="space-y-2 border-t border-gray-800 pt-4">
          <label className="text-gray-400 text-xs uppercase tracking-wider block">Güvenlik (E-posta)</label>
          <p className="text-white/70 text-sm font-mono mb-2">{student.email || 'Kayıtlı e-posta yok'}</p>

          {!showEmailChange ? (
            <button onClick={() => setShowEmailChange(true)} className="text-xs text-gray-500 hover:text-white transition-colors underline">
              E-postayı güncelle
            </button>
          ) : (
            <div className="space-y-2 mt-2">
              {emailStep === 'input' ? (
                <>
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="yeni@eposta.com" className="w-full bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#FF4500] transition-colors" />
                  <button onClick={handleSendEmailCode} disabled={savingEmail} className="w-full py-2 bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/30 rounded-lg text-sm font-semibold hover:bg-[#FF4500]/20 transition-all disabled:opacity-40">
                    {savingEmail ? 'Gönderiliyor...' : 'Doğrulama Kodu İste'}
                  </button>
                </>
              ) : (
                <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-lg p-3">
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
