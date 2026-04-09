import { useState, useEffect, useRef } from 'react';
import { Student, Lesson, Trailer } from '../../types/student';
import { ProfileSection } from '../Dashboard/ProfileSection';
import { TopBar } from '../Dashboard/TopBar';
import { MessageFeed } from '../Dashboard/MessageFeed';
import { OperationDrawer } from '../Drawer/OperationDrawer';
import { FeedbackForm } from '../Feedback/FeedbackForm';
import { ArchivePage } from '../Archive/ArchivePage';
import { LevelProgress } from './LevelProgress';
import { ActivityPage } from './ActivityPage';
import { FeedbackHistory } from '../Feedback/FeedbackHistory';
import { useAutoMessages } from '../../hooks/useAutoMessages';
import { useAutoZoom } from '../../hooks/useAutoZoom';
import { useNotifications } from '../../hooks/useNotifications';
import { subscribeToTrailer } from '../../services/dbFirebase';
import { LESSON_CONFIG } from '../../config/lessonSchedule';
import { recordAttendance } from '../../services/db';

type AgentTab = 'home' | 'operation' | 'levels' | 'archive' | 'activity' | 'feedback';

const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 8.71l-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105"/><path d="M16 15c-2.21 1.333-5.792 1.333-8 0"/></svg>,
  Swords: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 9.5l-9 9M9.5 14.5l-4-4M16 8l4-4M16 8a2 2 0 0 0 -2.828 -2.828L8 10l-4 4 4 4 4-4 4.828-5.172A2 2 0 0 0 16 8z"/></svg>,
  Trophy: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Film: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"/></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

export const AgentDashboard = ({
  student, onLogout, lesson
}: {
  student: Student; onLogout: () => void; lesson: Lesson | null;
}) => {
  void onLogout; 

  const [activeTab, setActiveTab] = useState<AgentTab>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [trailer, setTrailerState] = useState<Trailer | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = (localStorage.getItem('nepTheme') as 'dark' | 'light') || 'dark';
    if (saved === 'light') document.body.classList.add('theme-light');
    else document.body.classList.remove('theme-light');
    return saved;
  });

  const handleThemeChange = (t: 'dark' | 'light') => {
    setTheme(t);
    localStorage.setItem('nepTheme', t);
    if (t === 'light') document.body.classList.add('theme-light');
    else document.body.classList.remove('theme-light');
  };

  useAutoMessages(false);
  const { unreadCount } = useNotifications(student.id);

  const autoZoomState = useAutoZoom(
    student.id, student.name, lesson?.zoomLink || LESSON_CONFIG.zoomLink
  );

  useEffect(() => {
    if (autoZoomState.status === 'feedback') {
      const feedbackShown = sessionStorage.getItem(`feedback_${autoZoomState.lessonDate}`);
      if (!feedbackShown) setShowFeedback(true);
    }
  }, [autoZoomState.status, autoZoomState.lessonDate]);

  const attendanceRecorded = useRef(false);
  useEffect(() => {
    if (student && !attendanceRecorded.current) {
      attendanceRecorded.current = true;
      void recordAttendance(student.id);
    }
  }, [student?.id]);

  useEffect(() => {
    const unsub = subscribeToTrailer(t => setTrailerState(t));
    return () => { unsub && unsub(); };
  }, []);

  const tabs: { id: AgentTab; label: string; icon: JSX.Element }[] = [
    { id: 'home', label: 'Ana Sayfa', icon: <Icons.Home /> },
    { id: 'levels', label: 'Level & Rozetler', icon: <Icons.Trophy /> },
    { id: 'archive', label: 'Arşiv', icon: <Icons.Film /> },
    { id: 'activity', label: 'Etkinlik', icon: <Icons.Calendar /> },
    { id: 'feedback', label: 'Geri Bildirim', icon: <Icons.Star /> },
  ];

  const tabTitles: Record<AgentTab, string> = {
    home: 'ANA SAYFA', operation: 'OPERASYON', levels: 'LEVEL & ROZETLER',
    archive: 'ARŞİV', activity: 'ETKİNLİK', feedback: 'GERİ BİLDİRİM',
  };

  return (
    <div className="h-[100dvh] bg-[#050505] text-white flex flex-col md:flex-row font-['Rajdhani',sans-serif] selection:bg-[#00F0FF]/30 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
        <div className="scanlines absolute inset-0" />
      </div>

      <OperationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}
        lesson={lesson} trailer={trailer} isAdmin={false}
        studentName={student.name} zoomLink={lesson?.zoomLink || LESSON_CONFIG.zoomLink} />

      {showFeedback && (
        <FeedbackForm lessonDate={autoZoomState.lessonDate} studentId={student.id}
          onClose={() => { setShowFeedback(false); sessionStorage.setItem(`feedback_${autoZoomState.lessonDate}`, 'true'); }} />
      )}

      {/* Mobil Üst Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-[#0A1128] border-b border-[#00F0FF]/20 flex items-center justify-between px-4 py-3">
        <button onClick={() => setDrawerOpen(true)} className="text-[#00F0FF] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Icons.Swords />
        </button>
        <img src={`${import.meta.env.BASE_URL}nep-logo.png`} alt="NEP" className="h-7 brightness-0 invert opacity-70" />
        <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center relative">
          <Icons.Menu />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF4500] rounded-full" />}
        </button>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 top-[52px] bg-black/80 z-20" onClick={() => setMobileNavOpen(false)}>
          <div className="bg-[#0A1128] border-b border-[#00F0FF]/20 p-4 space-y-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileNavOpen(false); }}
                className={`flex items-center gap-3 w-full p-3 rounded-md transition-all min-h-[48px] ${
                  activeTab === tab.id ? 'bg-[#00F0FF]/10 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'
                }`}>
                {tab.icon}
                <span className="font-semibold tracking-wide">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0A1128] border-r border-[#00F0FF]/20 z-10 flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-[#00F0FF]/20 flex items-center justify-center">
          <img src={`${import.meta.env.BASE_URL}nep-logo.png`} alt="NEP" className="h-10 brightness-0 invert opacity-80" />
        </div>
        <div className="p-4 border-b border-[#6358cc]/20">
          <button onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-3 w-full p-3 rounded-md bg-[#6358cc]/10 text-[#8b7fd8] hover:bg-[#6358cc]/20 border border-[#6358cc]/30 transition-all">
            <Icons.Swords />
            <span className="font-bold tracking-wide text-sm">DERSE KATIL</span>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 w-full p-3 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00F0FF]/10 text-[#00F0FF] border-l-4 border-[#00F0FF]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
              {tab.icon}
              <span className="font-semibold tracking-wide">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-8 z-10 h-[100dvh] overflow-hidden pb-24 md:pb-8">
        <header className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
          <div>
            <h2 className="text-xs sm:text-sm tracking-[0.2em] uppercase mb-1 flex items-center gap-2 text-[#00F0FF]">
              <span className="inline-block w-2 h-2 animate-pulse rounded-full bg-[#00F0FF]" /> Ajan
            </h2>
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {tabTitles[activeTab]}
            </h1>
          </div>
          <TopBar student={student} unreadCount={unreadCount} theme={theme} onThemeChange={handleThemeChange} />
        </header>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'home' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full items-start">
                
                {/* SOL TARAF: Profil ve Envanter */}
                <div className="xl:col-span-7 flex flex-col gap-6">
                  <ProfileSection student={student} />

                  {/* Dinamik Feedback Butonu */}
                  {autoZoomState.status === 'feedback' && !showFeedback && (
                    <button
                      onClick={() => setShowFeedback(true)}
                      className="w-full bg-gradient-to-r from-[#FF9F43]/20 to-[#FF4500]/20 border border-[#FF9F43]/40 text-[#FF9F43] py-4 rounded-lg font-bold uppercase tracking-wider text-sm hover:from-[#FF9F43]/30 hover:to-[#FF4500]/30 transition-all animate-pulse"
                    >
                      📝 Ders Hakkında Geri Bildirim Ver
                    </button>
                  )}
                </div>

                {/* SAĞ TARAF: İletişim / Mesajlar (Sabit yükseklikte kaydırılabilir) */}
                <div className="xl:col-span-5 bg-[#0A1128]/80 border border-[#00F0FF]/20 rounded-2xl h-[500px] xl:h-full flex flex-col overflow-hidden">
                  <div className="bg-[#00F0FF]/10 px-4 py-3 border-b border-[#00F0FF]/20 shrink-0">
                    <h3 className="text-[#00F0FF] font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
                      Gelen Kutusu
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <MessageFeed />
                  </div>
                </div>

              </div>
            )}
            
            {activeTab === 'levels' && <LevelProgress student={student} />}
            {activeTab === 'archive' && <ArchivePage />}
            {activeTab === 'activity' && <ActivityPage student={student} />}
            {activeTab === 'feedback' && <FeedbackHistory studentId={student.id} />}
          </div>
        </div>
      </main>

      {/* Mobil Alt Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A1128] border-t border-[#00F0FF]/20 z-20 flex items-center justify-around px-1 py-2 safe-area-bottom">
        {[
          { id: 'home' as AgentTab, icon: <Icons.Home />, label: 'ANA SAYFA' },
          { id: 'operation' as AgentTab, icon: <Icons.Swords />, label: 'OPERASYON', action: () => setDrawerOpen(true) },
          { id: 'levels' as AgentTab, icon: <Icons.Trophy />, label: 'LEVEL' },
          { id: 'archive' as AgentTab, icon: <Icons.Film />, label: 'ARŞİV' },
          { id: 'feedback' as AgentTab, icon: <Icons.Star />, label: 'GERİ BİLDİRİM' },
        ].map(item => (
          <button key={item.id}
            onClick={item.action || (() => setActiveTab(item.id))}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all min-w-[52px] min-h-[48px] ${
              activeTab === item.id && !item.action ? 'text-[#00F0FF]' : item.action ? 'bg-[#6358cc]/20 text-[#8b7fd8]' : 'text-gray-500'
            }`}>
            {item.icon}
            <span className="text-[9px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
