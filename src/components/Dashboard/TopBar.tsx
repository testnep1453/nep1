import { useState, useEffect } from 'react';
import { Student } from '../../types/student';
import { NotificationPanel } from './NotificationPanel';
import { Settings } from 'lucide-react';

interface TopBarProps {
  student: Student;
  unreadCount: number;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  onOpenSettings?: () => void;
}

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);


const InstallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-4 h-4 sm:w-5 sm:h-5">
    <path fillRule="evenodd" clipRule="evenodd" d="M13.75 13.75C13.75 14.1642 13.4142 14.5 13 14.5L3 14.5C2.58579 14.5 2.25 14.1642 2.25 13.75C2.25 13.3358 2.58579 13 3 13L13 13C13.4142 13 13.75 13.3358 13.75 13.75Z" fill="currentColor"></path>
    <path fillRule="evenodd" clipRule="evenodd" d="M8.7487 2C8.7487 1.58579 8.41291 1.25 7.9987 1.25C7.58448 1.25 7.2487 1.58579 7.2487 2L7.2487 9.53955L3.19233 5.51449C2.89831 5.22274 2.42344 5.22458 2.13168 5.5186C1.83993 5.81263 1.84177 6.2875 2.13579 6.57925L7.46912 11.8714C7.76154 12.1616 8.23325 12.1616 8.52567 11.8714L13.859 6.57926C14.153 6.2875 14.1549 5.81263 13.8631 5.5186C13.5714 5.22458 13.0965 5.22274 12.8025 5.51449L8.7487 9.53697L8.7487 2Z" fill="currentColor"></path>
  </svg>
);

export const TopBar = ({ student, unreadCount, theme = 'dark', onThemeChange, onOpenSettings }: TopBarProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const isAdmin = student.id === '1002';
  const accentColor = isAdmin ? '#39FF14' : '#00F0FF';

  // PWA & Kurulum State'leri
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showManualPrompt, setShowManualPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(() => {
    return localStorage.getItem('pwa_guide_dismissed') === 'true';
  });

  // Cihaz/Tarayıcı Algılama
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowManualPrompt(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3 relative">
        
        {!isStandalone && (deferredPrompt || !guideDismissed) && (
          <div className="relative flex items-center">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#39FF14]/10 hover:bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30 transition-all font-bold text-xs shadow-[0_0_10px_rgba(57,255,20,0.2)] animate-pulse"
              title="Sistemi Cihaza Yükle"
            >
              <InstallIcon />
              <span className="hidden sm:inline tracking-wider">YÜKLE</span>
            </button>

            {showManualPrompt && (
              <div className="absolute top-12 right-0 w-[calc(100vw-2rem)] max-w-sm md:max-w-md bg-[#0A1128] border border-[#00F0FF]/40 p-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50">
                <p className="text-[#00F0FF] font-bold text-sm mb-2 border-b border-[#00F0FF]/20 pb-1">
                  Kurulum Kılavuzu:
                </p>
                <div className="text-gray-300 text-xs space-y-2 leading-relaxed">
                  {isIOS ? (
                    <>
                      <p>1. Tarayıcının altındaki <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Paylaş 🔗</span> ikonuna dokunun.</p>
                      <p>2. <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Ana Ekrana Ekle ➕</span> seçeneğine dokunun.</p>
                    </>
                  ) : isDesktop ? (
                    <>
                      <p>1. Adres çubuğunun sağındaki <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Yükle ⬇️</span> veya <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Uygulamayı yükle 💻</span> ikonuna tıklayın.</p>
                      <p>2. Veya sağ üstteki <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Üç Nokta ⋮ / Üç Çizgi ≡</span> menüsüne basıp <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Kaydet ve Paylaş &gt; NEP — Eğitim Operasyon Merkezi uygulamasını yükle</span> seçeneğine tıklayın.</p>
                    </>
                  ) : (
                    <>
                      <p>1. Tarayıcının <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Menü ⋮</span> ikonuna dokunun.</p>
                      <p>2. <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Uygulamayı Yükle ⬇️</span> veya <span className="inline-block bg-white/10 px-1 rounded text-white border border-white/20">Ana Ekrana Ekle</span> seçeneğine dokunun.</p>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setShowManualPrompt(false);
                    localStorage.setItem('pwa_guide_dismissed', 'true');
                    setGuideDismissed(true);
                  }} 
                  className="mt-4 w-full bg-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/30 py-2 rounded-lg font-bold transition-colors"
                >
                  Anladım
                </button>
              </div>
            )}
          </div>
        )}

        {isAdmin && onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#39FF14] border border-white/10 transition-all group ml-1 sm:ml-2"
            title="Sistem Ayarları"
          >
            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        )}

        {['1001', '1003'].includes(student.id) && (
          <div className="relative">
            <button
              onClick={(e) => { 
                e.stopPropagation();
                setShowNotifications(!showNotifications); 
                setShowManualPrompt(false); 
              }}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-[#FF4500] rounded-full flex items-center justify-center text-[10px] text-white font-bold px-1 shadow-[0_0_8px_rgba(255,69,0,0.6)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationPanel studentId={student.id} isOpen={showNotifications} onClose={() => setShowNotifications(false)} unreadCount={unreadCount} />
            )}
          </div>
        )}
      </div>
    </>
  );
};



