/**
 * TopBar — Ortak üst bar (Modül 1.2)
 * Sol: NEP logosu
 * Sağ: Bildirim çanı + Profil avatarı
 */

import { useState } from 'react';
import { Student } from '../../types/student';
import { NotificationPanel } from './NotificationPanel';
import { ProfileModal } from './ProfileModal';

interface TopBarProps {
  student: Student;
  unreadCount: number;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const TopBar = ({ student, unreadCount, theme, onThemeChange }: TopBarProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const isAdmin = student.id === '1002';
  const accentColor = isAdmin ? '#39FF14' : '#00F0FF';

  return (
    <>
      <div className="hidden md:flex items-center justify-between px-6 py-3 bg-[#0A1128]/80 border-b border-white/10 z-30 relative">
        {/* Sol — Logo */}
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}nep-logo.png`}
            alt="NEP"
            className="h-8 brightness-0 invert opacity-80"
          />
        </div>

        {/* Sağ — Bildirim + Profil */}
        <div className="flex items-center gap-3">
          {/* Bildirim çanı */}
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#FF4500] rounded-full flex items-center justify-center text-[10px] text-white font-bold px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profil */}
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: `${accentColor}30`, borderColor: `${accentColor}60`, borderWidth: 1 }}
            >
              {student.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-300 font-medium hidden lg:block">
              {student.nickname || student.name.split(' ')[0]}
            </span>
            <UserIcon />
          </button>
        </div>

        {/* Bildirim Paneli */}
        {showNotifications && (
          <NotificationPanel
            studentId={student.id}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            unreadCount={unreadCount}
          />
        )}
      </div>

      {/* Profil Modal */}
      <ProfileModal
        student={student}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        theme={theme}
        onThemeChange={onThemeChange}
      />
    </>
  );
};
