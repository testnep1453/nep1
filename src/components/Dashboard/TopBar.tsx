import { useState, useEffect } from 'react';
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

const InstallIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const TopBar = ({ student, unreadCount, theme, onThemeChange }: TopBarProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const isAdmin = student.id === '1002';
  const accentColor = isAdmin ? '#39FF14' : '#00F0FF';

  // PWA & Kurulum State'leri
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showManualPrompt, setShowManualPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Cihaz/Tarayıcı Algılama
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isFirefox = /Firefox/i.test(navigator.userAgent);
  const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    // Uygulama zaten yüklü mü kontrol et
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             (window.navigator as any).standalone === true;
    };
    setIsStandalone(checkStandalone());

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); 
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    // Eğer Chrome destekliyorsa ve butonu verdiyse direkt kur
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Desteklemiyorsa (iOS, Firefox veya Chrome PC gizlediyse) akıllı menüyü aç
      setShowManualPrompt(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3 relative">
        
        {/* Uygulama yüklenmemişse "YÜKLE" butonu HER ZAMAN çıksın */}
        {!isStandalone && (
          <div className="relative">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#39FF14]/10 hover:bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30 transition-all font-bold text-xs shadow-[0_0_10px_rgba(57,255,20,0.2)] animate-pulse"
              title="Sistemi Cihaza Yükle"
            >
              <InstallIcon />
              <span className="hidden sm:inline tracking-wider">YÜKLE</span>
            </button>

            {/* Akıllı Kılavuz Modal'ı */}
            {showManualPrompt && (
              <div className="absolute top-12 right-0 w-72 bg-[#0A1128] border border-[#00F0FF]/40 p-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50">
                <p className="text-[#00F0FF] font-bold text-sm mb-2 border-b border-[#00F0FF]/20 pb-1">
                  Kurulum Kılavuzu:
                </p>
                <div className="text-gray-300 text-xs space-y-2 leading-relaxed">
                  {isIOS ? (
                    <>
                      <p>1. Tarayıcının altındaki <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Paylaş 🔗</span> ikonuna dokunun.</p>
                      <p>2. <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Ana Ekrana Ekle ➕</span> seçeneğine dokunun.</p>
                    </>
                  ) : isFirefox ? (
                    <>
                      <p>1. Sağ üstteki <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Üç Nokta ⋮</span> menüsüne dokunun.</p>
                      <p>2. <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Uygulamayı Yükle ⬇️</span> veya <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Ana Ekrana Ekle</span> seçeneğine dokunun.</p>
                    </>
                  ) : isDesktop ? (
                    <>
                      <p>1. Adres çubuğunun en sağındaki <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Yükle ⬇️</span> veya <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Ekran 💻</span> ikonuna tıklayın.</p>
                      <p>2. Veya sağ üstteki <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Üç Nokta ⋮</span> ikonuna basıp <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Ana Ekrana Ekle</span> seçeneğine tıklayabilirsiniz.</p>
                    </>
                  ) : (
                    <>
                      <p>Sağ üstteki <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Üç Nokta ⋮</span> menüsüne basıp <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Ana Ekrana Ekle</span> seçeneğine tıklayarak kurulum yapabilirsiniz.</p>
                    </>
                  )}
                </div>
                <button onClick={() => setShowManualPrompt(false)} className="mt-4 w-full bg-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/30 py-2 rounded-lg font-bold transition-colors">
                  Anladım
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setShowManualPrompt(false); }}
          className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#FF4500] rounded-full flex items-center justify-center text-[10px] text-white font-bold px-1 shadow-[0_0_8px_rgba(255,69,0,0.6)]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowManualPrompt(false); }}
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

        {showNotifications && (
          <NotificationPanel studentId={student.id} isOpen={showNotifications} onClose={() => setShowNotifications(false)} unreadCount={unreadCount} />
        )}
      </div>

      <ProfileModal student={student} isOpen={showProfile} onClose={() => setShowProfile(false)} theme={theme} onThemeChange={onThemeChange} />
    </>
  );
};
