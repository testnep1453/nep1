import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { StudentLogin } from './components/Auth/StudentLogin';
import { LoginTransitionOverlay } from './components/Transitions/LoginTransitionOverlay';
import { CircularCountdown } from './components/Countdown/CircularCountdown';
import { JoinClassButton } from './components/Countdown/JoinClassButton';
import { ProfileSection } from './components/Dashboard/ProfileSection';
import { PresenceCounter } from './components/Dashboard/PresenceCounter';
import { NotificationBell } from './components/Dashboard/NotificationBell';
import { ThemeToggle } from './components/Dashboard/ThemeToggle';
import { YouTubePlayer } from './components/VideoTheater/YouTubePlayer';
import { AdminDrawer } from './components/Admin/AdminDrawer';
import { Lesson, Theme } from './types/student';
import { requestNotificationPermission, setupNotificationListener } from './services/fcm';

type AppStatus = 'loggingIn' | 'loginSuccessTransition' | 'dashboard';

function App() {
  const { student, loading, login } = useAuth();
  const onlineCount = usePresence(student?.id || null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [showJoinButton, setShowJoinButton] = useState(false);
  const [appStatus, setAppStatus] = useState<AppStatus>('loggingIn');

  useEffect(() => {
    if (student) {
      requestNotificationPermission();
      setupNotificationListener((payload) => {
        console.log('Bildirim alındı:', payload);
      });

      const loadLesson = async () => {
        try {
          const lessonDoc = await getDoc(doc(db, 'lessons', 'nextLesson'));
          if (lessonDoc.exists()) {
            const data = lessonDoc.data();
            setLesson({
              startTime: data.startTime?.toMillis() || Date.now() + 3 * 24 * 60 * 60 * 1000,
              title: data.title || 'Sıradaki Ders',
              zoomLink: data.zoomLink || 'https://us06web.zoom.us/j/81331199971?pwd=wEBSZPJcBJg3MbV4FqGMO7ggJ3onM8.1'
            });
          } else {
            setLesson({
              startTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
              title: 'Demo Ders',
              zoomLink: 'https://us06web.zoom.us/j/81331199971?pwd=wEBSZPJcBJg3MbV4FqGMO7ggJ3onM8.1'
            });
          }
        } catch (error) {
          console.error('Ders yüklenirken hata oluştu:', error);
          setLesson({
            startTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
            title: 'Demo Ders',
            zoomLink: 'https://us06web.zoom.us/j/81331199971?pwd=wEBSZPJcBJg3MbV4FqGMO7ggJ3onM8.1'
          });
        }
      };

      loadLesson();
    }

    if (student && appStatus === 'loggingIn') {
      setAppStatus('loginSuccessTransition');
      // BEKLEME SÜRESİ YAVAŞLATILDI (5 Saniye)
      setTimeout(() => {
        setAppStatus('dashboard');
      }, 5000); 
    } else if (!student && appStatus === 'dashboard') {
      setAppStatus('loggingIn');
    }

  }, [student]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#25293c] flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">YÜKLENİYOR...</div>
      </div>
    );
  }

  if (appStatus === 'loginSuccessTransition' && student) {
    return <LoginTransitionOverlay studentName={student.name} />;
  }

  if (appStatus === 'loggingIn' && !student) {
    return <StudentLogin onLogin={login} />;
  }

  const bgColor = theme === 'dark' ? 'bg-gradient-to-br from-[#1a1d2e] via-[#25293c] to-[#1a1d2e]' : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100';
  const textColor = theme === 'dark' ? 'text-[#cfcce4]' : 'text-gray-800';

  if (appStatus === 'dashboard' && student) {
    return (
      <div className={`min-h-screen ${bgColor} ${textColor} p-4 md:p-8 relative`}>
        {student.id === '1002' && <AdminDrawer />}
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-10">
            <div className="flex flex-col items-start">
              <img 
                src="/68b42031492c916cc2c20789_nep_logo%201.png" 
                alt="NEP Logo" 
                className="h-10 md:h-14 object-contain mb-1 brightness-0 invert drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
              />
              <p className="text-[#00cfe8] font-semibold tracking-[0.2em] text-xs md:text-sm uppercase">OPERASYON KONTROL MERKEZİ</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </header>

          <h3 className="text-xl font-bold text-white/80 mb-4 uppercase tracking-wider border-b-2 border-[#00cfe8]/30 pb-2">
            👤 AJAN PROFİLİ
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2">
              <ProfileSection student={student} />
            </div>
            <div>
              <PresenceCounter count={onlineCount} />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white/80 mb-4 uppercase tracking-wider border-b-2 border-[#00cfe8]/30 pb-2 mt-8">
            ⏱️ AKTİF OPERASYON (NEP HAFTALIK GÖREVİ)
          </h3>
          <div className="mb-12 bg-gradient-to-br from-[#2d3142] to-[#25293c] rounded-2xl p-8 border-2 border-[#6358cc]/30 shadow-xl">
            {lesson && !showJoinButton && (
              <CircularCountdown
                targetTime={lesson.startTime}
                onComplete={() => setShowJoinButton(true)}
              />
            )}
            {showJoinButton && lesson && (
              <div className="py-12">
                <h2 className="text-3xl font-bold text-white text-center mb-8 uppercase tracking-wider">
                  {lesson.title}
                </h2>
                <JoinClassButton
                  zoomLink={lesson.zoomLink}
                  studentName={student.name}
                />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-white/80 mb-4 uppercase tracking-wider border-b-2 border-[#6358cc]/30 pb-2">
            🎬 MEDYA EKRANI
          </h3>
          <div className="mb-12">
            <YouTubePlayer videoId="dQw4w9WgXcQ" />
          </div>

        </div>
      </div>
    );
  }

  return null;
}

export default App;
