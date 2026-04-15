import { useState, useEffect, useRef } from 'react';
import { Student, Lesson, Trailer } from '../../types/student';
import { ProfileSection } from '../Dashboard/ProfileSection';
import { TopBar } from '../Dashboard/TopBar';
import { OperationDrawer } from '../Drawer/OperationDrawer';
import { FeedbackForm, isFeedbackTime } from '../Feedback/FeedbackForm';
import { ArchivePage } from '../Archive/ArchivePage';
import { LevelProgress } from './LevelProgress';
import { ActivityPage } from './ActivityPage';
import { SurveysClient } from './SurveysClient';
import { KnowledgeClient } from './KnowledgeClient';
import { useAutoZoom } from '../../hooks/useAutoZoom';
import { useNotifications } from '../../hooks/useNotifications';
import { subscribeToTrailer } from '../../services/dbFirebase';
import { LESSON_CONFIG } from '../../config/lessonSchedule';
import { recordAttendance } from '../../services/db';

type AgentTab = 'home' | 'operation' | 'levels' | 'archive' | 'activity' | 'feedback' | 'knowledge';

const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 8.71l-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105"/><path d="M16 15c-2.21 1.333-5.792 1.333-8 0"/></svg>,
  Target: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>,
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
  // Tema: sadece dark mod

  const { unreadCount } = useNotifications(student.id);
  const autoZoomState = useAutoZoom(student.id, student.name, lesson?.zoomLink || LESSON_CONFIG.zoomLink);

  useEffect(() => {
    if (autoZoomState.status === 'feedback' && isFeedbackTime(autoZoomState.lessonDate)) {
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
    { id: 'knowledge', label: 'Bilgi Odası', icon: <span className="text-xl -mt-1 -ml-0.5">📚</span> },
    { id: 'feedback', label: 'Sorgu Odası', icon: <span className="text-xl -mt-1 -ml-0.5">📋</span> },
  ];

  const tabTitles: Record<AgentTab, string> = {
    home: 'AJAN KARARGAHI', operation: 'OPERASYON', levels: 'LEVEL & ROZETLER',
    archive: 'ARŞİV', activity: 'ETKİNLİK', feedback: 'SORGU ODASI', knowledge: 'BİLGİ ODASI',
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white flex flex-col md:flex-row font-['Rajdhani',sans-serif] overflow-hidden selection:bg-[#00F0FF]/30">
      
      {/* Arka Plan Efektleri */}
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
      <div className="md:hidden flex-none z-30 bg-[#0A1128] border-b border-[#00F0FF]/20 flex items-center justify-between px-4 py-2">
        <button onClick={() => setDrawerOpen(true)} className="text-[#00F0FF] p-2 flex items-center justify-center">
          <Icons.Target />
        </button>
        <img src={`${import.meta.env.BASE_URL}nep-logo.png`} alt="NEP" className="h-6 brightness-0 invert opacity-70" />
        <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="text-white p-2 flex items-center justify-center relative">
          <Icons.Menu />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF4500] rounded-full" />}
        </button>
      </div>

      {/* Mobil Menü Modal */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 top-[48px] bg-black/80 z-20" onClick={() => setMobileNavOpen(false)}>
          <div className="bg-[#0A1128] border-b border-[#00F0FF]/20 p-4 space-y-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileNavOpen(false); }}
                className={`flex items-center gap-3 w-full p-3 rounded-md transition-all ${
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
      <aside className="hidden md:flex w-64 bg-[#0A1128] border-r border-[#00F0FF]/20 z-10 flex-col h-full flex-none">
        <div className="p-6 border-b border-[#00F0FF]/20 flex items-center justify-center">
          <img src={`${import.meta.env.BASE_URL}nep-logo.png`} alt="NEP" className="h-10 brightness-0 invert opacity-80" />
        </div>
        <div className="p-4 border-b border-[#6358cc]/20">
          <button onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-3 w-full p-3 rounded-md bg-[#6358cc]/10 text-[#8b7fd8] hover:bg-[#6358cc]/20 border border-[#6358cc]/30 transition-all shadow-[0_0_15px_rgba(99,88,204,0.2)]">
            <Icons.Target />
            <span className="font-bold tracking-wide text-sm">DERSE KATIL</span>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
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

      {/* ANA EKRAN İÇERİĞİ (TAMAMEN SCROLL'SUZ) */}
      <main className="flex-1 flex flex-col h-[calc(100dvh-48px)] md:h-[100dvh] z-10 overflow-hidden relative">
        
        <header className="flex-none flex items-center justify-between p-4 md:p-6 shrink-0">
          <div>
            <h2 className="text-[10px] sm:text-xs tracking-[0.2em] uppercase mb-0.5 flex items-center gap-2 text-[#00F0FF]">
              <span className="inline-block w-1.5 h-1.5 animate-pulse rounded-full bg-[#00F0FF]" /> Sisteme Bağlı
            </h2>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {tabTitles[activeTab]}
            </h1>
          </div>
          <TopBar student={student} unreadCount={unreadCount} />
        </header>

        {/* PROFIL KARTI MERKEZLEME ALANI */}
        <div className="flex-1 flex flex-col p-4 md:p-6 pt-0 overflow-hidden">
          <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center h-full">
            
            {activeTab === 'home' && (
              <div className="flex flex-col gap-4 animate-fade-in w-full h-full pb-2 md:pb-6">
                
                <ProfileSection student={student} />

                {autoZoomState.status === 'feedback' && !showFeedback && (
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="w-full bg-gradient-to-r from-[#FF9F43]/20 to-[#FF4500]/20 border border-[#FF9F43]/40 text-[#FF9F43] py-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:from-[#FF9F43]/30 hover:to-[#FF4500]/30 transition-all animate-pulse shadow-[0_0_20px_rgba(255,69,0,0.2)] flex-none"
                  >
                    📝 Ders Hakkında Geri Bildirim Ver
                  </button>
                )}
              </div>
            )}
            
            {activeTab === 'levels' && <div className="overflow-y-auto h-full pr-2 custom-scrollbar"><LevelProgress student={student} /></div>}
            {activeTab === 'archive' && <div className="overflow-y-auto h-full pr-2 custom-scrollbar"><ArchivePage /></div>}
            {activeTab === 'activity' && <div className="overflow-y-auto h-full pr-2 custom-scrollbar"><ActivityPage student={student} /></div>}
            {activeTab === 'feedback' && <div className="overflow-y-auto h-full pr-2 custom-scrollbar"><SurveysClient /></div>}
            {activeTab === 'knowledge' && <div className="overflow-hidden h-full"><KnowledgeClient /></div>}
          </div>
        </div>
      </main>

      {/* Mobil Alt Bar */}
      <div className="md:hidden flex-none bg-[#0A1128] border-t border-[#00F0FF]/20 z-20 flex items-center justify-around px-1 py-1 pb-safe overflow-x-auto">
        {[
          { id: 'home' as AgentTab, icon: <Icons.Home />, label: 'LOBİ' },
          { id: 'operation' as AgentTab, icon: <Icons.Target />, label: 'OPE', action: () => setDrawerOpen(true) },
          { id: 'levels' as AgentTab, icon: <Icons.Trophy />, label: 'LEVEL' },
          { id: 'knowledge' as AgentTab, icon: <span className="text-xl leading-none">📚</span>, label: 'BİLGİ' },
          { id: 'feedback' as AgentTab, icon: <span className="text-xl leading-none">📋</span>, label: 'SORGU' },
        ].map(item => (
          <button key={item.id}
            onClick={item.action || (() => setActiveTab(item.id))}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all min-w-[52px] ${
              activeTab === item.id && !item.action ? 'text-[#00F0FF]' : item.action ? 'bg-[#6358cc]/20 text-[#8b7fd8]' : 'text-gray-500'
            }`}>
            {item.icon}
            <span className="text-[8px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
