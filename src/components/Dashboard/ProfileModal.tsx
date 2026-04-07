/**
 * Profil Modalı (Modül 1.3)
 * - Sadece Nickname değiştirilebilir
 * - E-posta değiştirebilir (cooldown ile)
 * - Tema seçimi (Modül 1.7)
 */

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

export const ProfileModal = ({ student, isOpen, onClose, theme, onThemeChange }: ProfileModalProps) => {
  const [nickname, setNickname] = useState(student.nickname || '');
  const [savingNickname, setSavingNickname] = useState(false);
  const [nickMsg, setNickMsg] = useState('');

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

      <div className="relative w-full max-w-md mx-4 bg-[#0A1128] border border-[#6358cc]/40 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Profil</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors">✕</button>
        </div>

        {/* Avatar + İsim */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#6358cc] to-[#00F0FF] flex items-center justify-center text-2xl font-bold text-white mb-3">
            {student.name.charAt(0)}
          </div>
          <p className="text-white font-semibold text-lg">{student.name}</p>
          <p className="text-gray-500 text-xs font-mono">ID: {student.id}</p>
        </div>

        {/* Nickname */}
        <div className="space-y-2 mb-6">
          <label className="text-gray-400 text-xs uppercase tracking-wider block">Nickname</label>
          <div className="flex gap-2">
            <input
              id="nicknameInput"
              name="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="flex-1 bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#6358cc] transition-colors"
            />
            <button
              onClick={handleSaveNickname}
              disabled={savingNickname || !nickname.trim()}
              className="px-4 py-2 bg-[#6358cc]/20 text-[#8b7fd8] border border-[#6358cc]/40 rounded-lg text-sm font-semibold hover:bg-[#6358cc]/30 transition-all disabled:opacity-40"
            >
              {savingNickname ? '...' : 'Kaydet'}
            </button>
          </div>
          {nickMsg && <p className="text-xs text-[#39FF14]">{nickMsg}</p>}
        </div>

        {/* E-posta */}
        <div className="space-y-2 mb-6">
          <label className="text-gray-400 text-xs uppercase tracking-wider block">E-posta</label>
          <p className="text-white/70 text-sm font-mono">{student.email || 'Kayıtlı e-posta yok'}</p>

          {!showEmailChange ? (
            <button
              onClick={() => setShowEmailChange(true)}
              className="text-xs text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors"
            >
              E-posta değiştir
            </button>
          ) : (
            <div className="space-y-2 mt-2">
              {emailStep === 'input' ? (
                <>
                  <input
                    id="newEmailInput"
                    name="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="yeni@eposta.com"
                    className="w-full bg-[#050505] border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#00F0FF] transition-colors"
                  />
                  <button
                    onClick={handleSendEmailCode}
                    disabled={savingEmail}
                    className="w-full py-2 bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 rounded-lg text-sm font-semibold hover:bg-[#00F0FF]/20 transition-all disabled:opacity-40"
                  >
                    {savingEmail ? 'Gönderiliyor...' : 'Doğrulama Linki Gönder'}
                  </button>
                </>
              ) : (
                <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-lg p-3">
                  <p className="text-xs text-[#39FF14]">✅ {emailMsg}</p>
                </div>
              )}
              {emailMsg && emailStep === 'input' && (
                <p className="text-xs text-[#FF4500]">{emailMsg}</p>
              )}
              {emailCooldown && (
                <p className="text-xs text-gray-500">Cooldown: {emailCooldown}</p>
              )}
            </div>
          )}
        </div>

        {/* Level & XP */}
        <div className="bg-[#050505] rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xs uppercase tracking-wider">Level {student.level}</span>
            <span className="text-[#00F0FF] text-xs font-mono">{student.xp} XP</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6358cc] to-[#00F0FF] rounded-full transition-all duration-500"
              style={{ width: `${Math.min((student.xp % 500) / 5, 100)}%` }}
            />
          </div>
        </div>

        {/* Tema Seçimi (Modül 1.7) */}
        <div className="space-y-2">
          <label className="text-gray-400 text-xs uppercase tracking-wider block">Tema</label>
          <div className="flex gap-2">
            <button
              onClick={() => onThemeChange('dark')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-[#6358cc]/20 text-[#8b7fd8] border border-[#6358cc]/50'
                  : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'
              }`}
            >
              🌙 Karanlık
            </button>
            <button
              onClick={() => onThemeChange('light')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                theme === 'light'
                  ? 'bg-[#6358cc]/20 text-[#8b7fd8] border border-[#6358cc]/50'
                  : 'bg-white/5 text-gray-500 border border-gray-700 hover:bg-white/10'
              }`}
            >
              ☀️ Aydınlık
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
