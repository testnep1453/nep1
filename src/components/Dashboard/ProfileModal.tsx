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

const AVAILABLE_AVATARS = ['hero_1', 'hero_2', 'hero_3', 'hero_4', 'hero_5', 'hero_6', 'hero_7', 'hero_8'];

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

  const handleAvatarSelect = async (avatarId: string) => {
    if (avatarId === student.avatar) return;
    
    setSavingAvatar(true);
    try {
      await updateDoc(doc(db, 'students', student.id), { avatar: avatarId });
      student.avatar = avatarId; // Local update
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

        {/* Profil Fotoğrafı (Avatar) Seçimi */}
        <div className="mb-8">
          <label className="text-gray-400 text-xs uppercase tracking-wider block mb-3">Kimlik Dosyası (Avatar)</label>
          <div className="grid grid-cols-4 gap-2">
            {AVAILABLE_AVATARS.map(avatar => (
              <button
                key={avatar}
                onClick={() => handleAvatarSelect(avatar)}
                disabled={savingAvatar}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  student.avatar === avatar || (!student.avatar && avatar === 'hero_1')
                    ? 'border-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.3)] scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-500'
                }`}
              >
                <img 
                  src={`${import.meta.env.BASE_URL}avatars/${avatar}.jpg`} 
                  alt={avatar}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                  }}
                />
                {(student.avatar === avatar || (!student.avatar && avatar === 'hero_1')) && (
                  <div className="absolute bottom-0 right-0 bg-[#39FF14] text-black text-[8px] font-bold px-1 rounded-tl">AKTİF</div>
                )}
              </button>
            ))}
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
