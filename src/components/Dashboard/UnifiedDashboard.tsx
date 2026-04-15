import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  getStudentsFromFirebase, addStudentToFirebase, addStudentsBatch, removeStudentFromFirebase,
  updateStudentInFirebase, addMessageToFirebase, setTrailer, disableTrailer, subscribeToTrailer,
  extractYoutubeId, getAllFeedback
} from '../../services/dbFirebase';
import { recordAttendance } from '../../services/db';
import { Student, Lesson, Trailer, FeedbackEntry } from '../../types/student';
import { TopBar } from './TopBar';
import { MessageFeed } from './MessageFeed';
import { YouTubePlayer } from '../VideoTheater/YouTubePlayer';
import { OperationDrawer } from '../Drawer/OperationDrawer';
import { FeedbackForm, isFeedbackTime } from '../Feedback/FeedbackForm';
import { AttendancePage } from '../Admin/AttendancePage';
import { ArchiveManager } from '../Admin/ArchiveManager';
import { ArchiveManager } from '../Admin/ArchiveManager';
import { SurveyManager } from '../Admin/SurveyManager';
import { getAllLoginLogs } from '../../services/loginAlertService';
import { useAutoMessages } from '../../hooks/useAutoMessages';

const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 8.71l-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105"/><path d="M16 15c-2.21 1.333-5.792 1.333-8 0"/></svg>,
  Target: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/></svg>,
  Message: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"/><path d="M9 12h12l-3 -3"/><path d="M18 15l3 -3"/></svg>,
  Film: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M7 15h10"/><path d="M7 7.5h10"/></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"/></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

export const UnifiedDashboard = ({
  student,
  onLogout,
  lesson,
  onlineCount
}: {
  student: Student;
  onLogout: () => void;
  lesson: Lesson | null;
  onlineCount: number;
}) => {
  const isAdmin = student.id === '1002';
  const [activeTab, setActiveTab] = useState<'genel' | 'ajanlar' | 'mesajlar' | 'fragman' | 'geribildirim' | 'yoklama' | 'arsiv' | 'cihazlar' | 'anket'>('genel');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
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
  const { unreadCount } = useNotifications(student.id);

  // Otomatik mesajlar
  useAutoMessages(isAdmin);

  // Zero-click zoom
  const autoZoomState = useAutoZoom(
    student.id,
    student.name,
    lesson?.zoomLink || LESSON_CONFIG.zoomLink
  );

  // Ders bittikten 15 dakika sonra feedback göster
  useEffect(() => {
    if (autoZoomState.status === 'feedback' && !isAdmin && isFeedbackTime(autoZoomState.lessonDate)) {
      const feedbackShown = sessionStorage.getItem(`feedback_${autoZoomState.lessonDate}`);
      if (!feedbackShown) {
        setShowFeedback(true);
      }
    }
  }, [autoZoomState.status, autoZoomState.lessonDate, isAdmin]);

  // Otomatik XP
  const attendanceRecorded = useRef(false);
  useEffect(() => {
    if (student && !attendanceRecorded.current) {
      attendanceRecorded.current = true;
      const result = recordAttendance(student.id);
      void result;
    }
  }, [student?.id]);

  // Admin State
  const [students, setStudents] = useState<Student[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messageTargetId, setMessageTargetId] = useState('');

  // Device Stats Limit State
  const [loginAlerts, setLoginAlerts] = useState<any[]>([]);

  // Fragman State
  const [trailer, setTrailerState] = useState<Trailer | null>(null);
  const [trailerYoutubeUrl, setTrailerYoutubeUrl] = useState('');
  const [trailerShowDate, setTrailerShowDate] = useState('');
  const [trailerShowTime, setTrailerShowTime] = useState('');

  // Excel State
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback State (Admin)
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      getStudentsFromFirebase().then(setStudents);
      getAllLoginLogs().then((logs) => setLoginAlerts(logs));
    }
  }, [isAdmin]);

  // Fragman dinleme
  useEffect(() => {
    const unsub = subscribeToTrailer((t) => {
      setTrailerState(t);
    });
    return () => { unsub && unsub(); };
  }, []);

  // Admin Feedback yükleme
  useEffect(() => {
    if (isAdmin && activeTab === 'geribildirim') {
      setFeedbackLoading(true);
      getAllFeedback().then((data) => {
        setFeedbackList(data);
        setFeedbackLoading(false);
      });
    }
  }, [isAdmin, activeTab]);

  const handleSetTrailer = async () => {
    const videoId = extractYoutubeId(trailerYoutubeUrl);
    if (!videoId) { alert('Geçerli bir YouTube linki girin.'); return; }
    // Tarih/saat girilmediyse bugünü ve saat 19.00'ı varsayılan olarak kullan
    const date = trailerShowDate || new Date().toISOString().slice(0, 10);
    const time = trailerShowTime || '19:00';
    await setTrailer({ youtubeId: videoId, showDate: date, showTime: time });
    setTrailerYoutubeUrl('');
    setTrailerShowDate('');
    setTrailerShowTime('');
    setUploadMessage('Fragman hemen yayınlandı!');
    setTimeout(() => setUploadMessage(''), 3000);
  };


  const handleRemoveTrailer = async () => {
    await disableTrailer();
    setUploadMessage('Fragman kaldırıldı.');
    setTimeout(() => setUploadMessage(''), 3000);
  };

  // Excel Yükleme
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      const validRows: Student[] = [];
      for (const row of rows) {
        const typedRow = row as Record<string, unknown>;
        const keys = Object.keys(typedRow);
        const id = String(typedRow[keys[0]] || '').trim();
        const name = String(typedRow[keys[1]] || '').trim();
        const nickname = String(typedRow[keys[2]] || '').trim();
        const email = String(typedRow[keys[3]] || '').trim();
        if (!id || !name) continue;
        if (validRows.some(s => s.id === id)) continue;
        validRows.push({
          id, name, nickname: nickname || undefined,
          email: email || '',
          xp: 0, level: 1, badges: [], avatar: 'hero_1',
          lastSeen: Date.now(), attendanceHistory: [], streak: 0,
        });
      }
      if (validRows.length === 0) {
        setUploadMessage('Excel dosyasında geçerli veri bulunamadı.');
        return;
      }
      const existing = await getStudentsFromFirebase();
      const existingIds = new Set(existing.map(s => s.id));
      const newStudents = validRows.filter(s => !existingIds.has(s.id));
      if (newStudents.length === 0) {
        setUploadMessage('Tüm öğrenciler zaten sistemde.');
        return;
      }
      await addStudentsBatch(newStudents);
      setUploadMessage(`${newStudents.length} ajan başarıyla eklendi!`);
      setStudents(await getStudentsFromFirebase());
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadMessage('Excel dosyası okunamadı: ' + (err as Error).message);
    }
    setTimeout(() => setUploadMessage(''), 5000);
  };

  // Tek Öğrenci Ekleme
  const [newStudent, setNewStudent] = useState({ id: '', name: '', nickname: '', email: '' });
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.id || !newStudent.name) {
      alert('ID ve İsim zorunludur!');
      return;
    }
    if (students.some(s => s.id === newStudent.id)) {
      alert('Bu ID zaten sistemde mevcut!');
      return;
    }
    const nickname = newStudent.nickname || `Ajan_${newStudent.id}`;
    const newS: Student = {
      id: newStudent.id, name: newStudent.name, nickname,
      email: newStudent.email || '',
      xp: 0, level: 1, badges: [], avatar: 'hero_1',
      lastSeen: Date.now(), attendanceHistory: [], streak: 0,
    };
    await addStudentToFirebase(newS);
    setStudents(await getStudentsFromFirebase());
    setNewStudent({ id: '', name: '', nickname: '', email: '' });
  };

  const [editStudent, setEditStudent] = useState<{ id: string; name: string; nickname: string; email: string } | null>(null);
  const handleSaveEdit = async () => {
    if (!editStudent || !editStudent.name) {
      alert('İsim zorunludur!');
      return;
    }
    try {
      await updateStudentInFirebase(editStudent.id, {
        name: editStudent.name,
        nickname: editStudent.nickname || `Ajan_${editStudent.id}`,
        email: editStudent.email || '',
      });
      setStudents(await getStudentsFromFirebase());
      setEditStudent(null);
    } catch (error) {
      console.error('Düzenleme hatası:', error);
      alert('Güncelleme sırasında hata oluştu.');
    }
  };

  const EXCLUDE_FROM_COUNT = ['1001', '1002', '1003'];
  const PROTECTED_IDS = ['1002'];
  const handleRemove = async (id: string, name: string) => {
    if (PROTECTED_IDS.includes(id)) {
      alert(`⚠️ Ajan ${name} (${id}) sistem tarafından korunan bir hesaptır ve silinemez.`);
      return;
    }
    if (!window.confirm(`Ajan ${name} (${id}) kalıcı olarak silinecek. Onaylıyor musunuz?`)) return;
    try {
      // Yalnızca Supabase'den sil (RTDB write izni yok)
      await removeStudentFromFirebase(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Ajan silme hatası:', error);
      alert('Silme işlemi sırasında hata oluştu.');
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      if (messageTargetId && messageTargetId.trim() !== '') {
        // Özel mesaj/bildirim (Yalnızca notification olarak hedef ID'ye gidebilir veya tabloya yazılabilir)
        // Mevcut addMessageToFirebase herksin okuduğu 'messages' tablosuna yazıyor.
        // O yüzden sadece notification olarak gönderebiliriz.
        await sendNotificationToAll([messageTargetId.trim()], {
          title: 'Gizli Ajan Mesajı',
          body: messageText.trim(),
          type: 'admin',
        });
        alert(`Mesaj ${messageTargetId} ID'li ajana iletildi!`);
      } else {
        await addMessageToFirebase(messageText.trim());
        const studentIds = students.map(s => s.id).filter(id => id !== '1002');
        await sendNotificationToAll(studentIds, {
          title: 'Admin Duyurusu',
          body: messageText.trim(),
          type: 'admin',
        });
        alert('Mesaj ve bildirimler tüm ajanlara iletildi!');
      }
      setMessageText('');
      setMessageTargetId('');
    }
  };

  const groupedFeedback = feedbackList.reduce<Record<string, FeedbackEntry[]>>((acc, fb) => {
    const key = fb.lessonDate || 'Bilinmeyen';
    if (!acc[key]) acc[key] = [];
    acc[key].push(fb);
    return acc;
  }, {});

  const tabConfig = isAdmin
    ? [
        { id: 'genel' as const, label: 'Ana Sayfa', icon: <Icons.Home /> },
        { id: 'ajanlar' as const, label: 'Ajan Yönetimi', icon: <Icons.Users /> },
        { id: 'fragman' as const, label: 'Fragman', icon: <Icons.Film /> },
        { id: 'yoklama' as const, label: 'Yoklama', icon: <Icons.Star /> },
        { id: 'arsiv' as const, label: 'Arşiv Yönetimi', icon: <Icons.Film /> },
        { id: 'mesajlar' as const, label: 'Mesaj Gönder', icon: <Icons.Message /> },
        { id: 'geribildirim' as const, label: 'Geri Bildirimler', icon: <Icons.Star /> },
        { id: 'cihazlar' as const, label: 'Cihaz İstatistikleri', icon: <Icons.Users /> },
        { id: 'anket' as const, label: 'Anket', icon: <Icons.Star /> },
      ]
    : [
        { id: 'genel' as const, label: 'Ana Sayfa', icon: <Icons.Home /> },
      ];


  return (
    <div className="h-[100dvh] bg-[#050505] text-white flex flex-col md:flex-row font-['Rajdhani',sans-serif] selection:bg-[#39FF14]/30 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
        <div className="scanlines absolute inset-0" />
      </div>

      <OperationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} lesson={lesson} trailer={trailer} isAdmin={isAdmin} studentName={student.name} zoomLink={lesson?.zoomLink || LESSON_CONFIG.zoomLink} />

      {showFeedback && (
        <FeedbackForm lessonDate={autoZoomState.lessonDate} studentId={student.id} onClose={() => { setShowFeedback(false); sessionStorage.setItem(`feedback_${autoZoomState.lessonDate}`, 'true'); }} />
      )}

      <div className="md:hidden sticky top-0 z-30 bg-[#0A1128] border-b border-[#39FF14]/20 flex items-center justify-between px-4 py-3">
        <button onClick={() => setDrawerOpen(true)} className="text-[#00F0FF] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Icons.Target />
        </button>
        <img src={`${import.meta.env.BASE_URL}nep-logo.png`} alt="NEP" className="h-7 brightness-0 invert opacity-70" />
        <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Icons.Menu />
        </button>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 top-[52px] bg-black/80 z-20" onClick={() => setMobileNavOpen(false)}>
          <div className="bg-[#0A1128] border-b border-[#39FF14]/20 p-4 space-y-2">
            {tabConfig.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileNavOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-md transition-all min-h-[48px] ${activeTab === tab.id ? (isAdmin ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'bg-[#00F0FF]/10 text-[#00F0FF]') : 'text-gray-400 hover:bg-white/5'}`}>
                {tab.icon}
                <span className="font-semibold tracking-wide">{tab.label}</span>
              </button>
            ))}
            {isAdmin && (
              <button onClick={onLogout} className="flex items-center gap-3 w-full p-3 rounded-md text-gray-500 hover:bg-white/5 hover:text-[#FF4500] transition-all font-semibold min-h-[48px] text-sm">
                <Icons.Logout /> Çıkış Yap
              </button>
            )}
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-64 bg-[#0A1128] border-r border-[#39FF14]/20 z-10 flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-[#39FF14]/20 flex items-center justify-center">
          <img src={`${import.meta.env.BASE_URL}nep-logo.png`} alt="NEP Logo" className="h-10 brightness-0 invert opacity-80" />
        </div>
        <div className="p-4 border-b border-[#6358cc]/20">
          <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-3 w-full p-3 rounded-md bg-[#6358cc]/10 text-[#8b7fd8] hover:bg-[#6358cc]/20 border border-[#6358cc]/30 transition-all">
            <Icons.Target /> <span className="font-bold tracking-wide text-sm">{isAdmin ? '⚡ DERS YÖNETİMİ' : '⚡ DERSE KATIL'}</span>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {tabConfig.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 w-full p-3 rounded-md transition-all ${activeTab === tab.id ? (isAdmin ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]' : 'bg-[#00F0FF]/10 text-[#00F0FF] border-l-4 border-[#00F0FF]') : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              {tab.icon} <span className="font-semibold tracking-wide">{tab.label}</span>
            </button>
          ))}
        </nav>
        {isAdmin && (
          <div className="p-4 border-t border-[#39FF14]/20">
            <button onClick={onLogout} className="flex items-center gap-3 w-full p-3 rounded-md text-gray-500 hover:text-[#FF4500] hover:bg-white/5 transition-all font-semibold tracking-wide text-sm">
              <Icons.Logout /> Çıkış Yap
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 p-4 md:p-8 z-10 overflow-y-auto pb-20 md:pb-8">
        <header className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className={`text-xs sm:text-sm tracking-[0.2em] uppercase mb-1 flex items-center gap-2 ${isAdmin ? 'text-[#39FF14]' : 'text-[#00F0FF]'}`}>
              <span className={`inline-block w-2 h-2 animate-pulse rounded-full ${isAdmin ? 'bg-[#39FF14]' : 'bg-[#00F0FF]'}`} /> {isAdmin ? 'Yönetici' : 'Ajan'}
            </h2>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {activeTab === 'genel' && 'ANA SAYFA'}
              {activeTab === 'fragman' && 'FRAGMAN YÖNETİMİ'}
              {activeTab === 'ajanlar' && 'AJAN YÖNETİMİ'}
              {activeTab === 'yoklama' && 'YOKLAMA'}
              {activeTab === 'arsiv' && 'ARŞİV YÖNETİMİ'}
              {activeTab === 'mesajlar' && 'MESAJ GÖNDER'}
              {activeTab === 'geribildirim' && 'GERİ BİLDİRİMLER'}
            </h1>
          </div>
          <TopBar student={student} unreadCount={unreadCount} theme={theme} onThemeChange={handleThemeChange} />
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'genel' && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#39FF14]/30 p-4 sm:p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#39FF14]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500" />
                    <h3 className="text-gray-400 text-xs sm:text-sm tracking-widest mb-2 font-mono">TOPLAM AKTİF AJAN</h3>
                    <p className="text-4xl sm:text-5xl font-bold text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
                      {students.filter(s => !EXCLUDE_FROM_COUNT.includes(s.id)).length}
                    </p>
                  </div>
                  <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#FFB000]/30 p-4 sm:p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFB000]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500" />
                    <h3 className="text-gray-400 text-xs sm:text-sm tracking-widest mb-2 font-mono">SİSTEM DURUMU</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-[#FFB000] mt-2 tracking-widest">STABİL</p>
                  </div>
                  <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#00F0FF]/30 p-4 sm:p-6 relative group overflow-hidden sm:col-span-2 md:col-span-1">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#00F0FF]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500" />
                    <h3 className="text-gray-400 text-xs sm:text-sm tracking-widest mb-2 font-mono">CANLI KULLANICI</h3>
                    <p className="text-4xl sm:text-5xl font-bold text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">{onlineCount}</p>
                  </div>
                </div>
              )}
              {isAdmin && (() => {
                const THREE_WEEKS = 21 * 24 * 60 * 60 * 1000;
                const inactiveAgents = students.filter(s => s.id !== '1002' && s.lastSeen && (Date.now() - s.lastSeen > THREE_WEEKS));
                if (inactiveAgents.length === 0) return null;
                return (
                  <div className="bg-[#0A1128]/80 border border-[#FF4500]/30 p-4 sm:p-6 rounded-lg">
                    <h3 className="text-[#FF4500] text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>⚠️</span> {inactiveAgents.length} Ajan 3+ Hafta Devamsız
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {inactiveAgents.slice(0, 10).map(a => <span key={a.id} className="text-xs bg-[#FF4500]/10 text-[#FF4500] px-2 py-1 rounded font-mono">{a.name} ({a.id})</span>)}
                      {inactiveAgents.length > 10 && <span className="text-xs text-gray-500">+{inactiveAgents.length - 10} daha</span>}
                    </div>
                  </div>
                );
              })()}
              <MessageFeed />
            </div>
          )}

          {/* TAB: FRAGMAN */}
          {isAdmin && activeTab === 'fragman' && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              <div className="bg-[#0A1128]/80 border border-[#F5D32E]/30 p-6 sm:p-8 clip-path-diagonal">
                <h3 className="text-lg sm:text-xl font-bold text-[#F5D32E] mb-6 uppercase tracking-wider text-center">
                  🎬 FRAGMAN AYARLARI
                </h3>
                <div className="space-y-4 max-w-xl mx-auto">
                  <div>
                    <label htmlFor="ytInput" className="text-gray-400 text-sm tracking-widest mb-1 block">YouTube Linki</label>
                    <input id="ytInput" name="ytInput" type="text" value={trailerYoutubeUrl}
                      onChange={(e) => setTrailerYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#F5D32E] font-mono transition-colors rounded" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dtInput" className="text-gray-400 text-sm tracking-widest mb-1 block">Gösterim Tarihi</label>
                      <input id="dtInput" name="trailerDate" type="date" value={trailerShowDate}
                        onChange={(e) => setTrailerShowDate(e.target.value)}
                        className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#F5D32E] transition-colors rounded min-h-[48px]" />
                    </div>
                    <div>
                      <label htmlFor="tmInput" className="text-gray-400 text-sm tracking-widest mb-1 block">Gösterim Saati</label>
                      <input id="tmInput" name="trailerTime" type="time" value={trailerShowTime}
                        onChange={(e) => setTrailerShowTime(e.target.value)}
                        className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#F5D32E] transition-colors rounded min-h-[48px]" />
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs">Tarih ve saat boş bırakılırsa fragman hemen yayınlanır.</p>
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSetTrailer} className="flex-1 bg-[#F5D32E]/20 hover:bg-[#F5D32E] text-[#F5D32E] hover:text-black border border-[#F5D32E] py-3 font-bold transition-all uppercase tracking-widest rounded min-h-[48px]">
                      📤 Yayınla
                    </button>
                    {trailer && trailer.isActive && (
                      <button onClick={handleRemoveTrailer} className="bg-[#FF4500]/20 hover:bg-[#FF4500] text-[#FF4500] hover:text-black border border-[#FF4500] py-3 px-6 font-bold transition-all uppercase tracking-widest rounded min-h-[48px]">
                        Kaldır
                      </button>
                    )}
                  </div>
                  {trailer && trailer.isActive && (
                    <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded p-3 text-center">
                      <span className="text-[#39FF14] text-sm">✅ Aktif: {trailer.youtubeId}</span>
                    </div>
                  )}
                  {uploadMessage && (
                    <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded p-3 text-center text-[#00F0FF] text-sm">{uploadMessage}</div>
                  )}
                </div>
              </div>
              {trailer && trailer.isActive && trailer.youtubeId && (
                <div className="bg-[#0A1128]/80 border border-[#FF4500]/30 p-6 sm:p-8 clip-path-diagonal">
                  <h3 className="text-lg sm:text-xl font-bold text-[#FF4500] mb-6 uppercase tracking-wider text-center">📺 ÖNİZLEME</h3>
                  <YouTubePlayer videoId={trailer.youtubeId} />
                </div>
              )}
            </div>
          )}


          {/* TAB: AJAN YÖNETİMİ */}
          {isAdmin && activeTab === 'ajanlar' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#0A1128]/80 border border-[#F5D32E]/30 p-4 sm:p-6 clip-path-diagonal">
                <h3 className="text-[#F5D32E] text-base sm:text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-xl">📊</span> Excel ile Toplu Ajan Ekle
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">Excel formatı: Sütun A = ID, Sütun B = İsim, Sütun C = Takma Ad, Sütun D = E-posta</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" aria-label="Excel Dosyası Yükle" onChange={handleExcelUpload} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#F5D32E]/20 file:text-[#F5D32E] file:font-bold file:cursor-pointer hover:file:bg-[#F5D32E]/30 mb-3" />
                {uploadMessage && <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded p-3 text-center text-[#39FF14] text-sm">{uploadMessage}</div>}
              </div>

              <div className="bg-[#0A1128]/80 border border-[#39FF14]/30 p-4 sm:p-6 clip-path-diagonal">
                <h3 className="text-[#39FF14] text-base sm:text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-xl">+</span> Tekil Ajan Kayıt
                </h3>
                <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input id="newStudentId" name="studentId" type="text" aria-label="ID" placeholder="ID (örn: 1005)" required value={newStudent.id} onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })} className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] font-mono transition-colors rounded" />
                  <input id="newStudentName" name="studentName" type="text" aria-label="İsim" placeholder="Gerçek İsim" required value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] transition-colors rounded" />
                  <input id="newStudentNick" name="studentNick" type="text" aria-label="Takma Ad" placeholder="Kod Adı (opsiyonel)" value={newStudent.nickname} onChange={(e) => setNewStudent({ ...newStudent, nickname: e.target.value })} className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] transition-colors rounded" />
                  <button type="submit" className="bg-[#39FF14]/20 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14] px-6 py-3 font-bold transition-all uppercase tracking-widest whitespace-nowrap rounded min-h-[48px]">Ekle</button>
                </form>
              </div>

              <div className="bg-[#0A1128]/60 border border-gray-800 overflow-x-auto rounded">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-700 font-mono text-gray-400 text-xs sm:text-sm">
                      <th className="p-3 sm:p-4 font-normal">ID</th>
                      <th className="p-3 sm:p-4 font-normal">İSİM</th>
                      <th className="p-3 sm:p-4 font-normal hidden md:table-cell">E-POSTA</th>
                      <th className="p-3 sm:p-4 font-normal hidden sm:table-cell">LEVEL</th>
                      <th className="p-3 sm:p-4 font-normal text-right">İŞLEM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {students.filter(s => !PROTECTED_IDS.includes(s.id)).map((stu) => (
                      <tr key={stu.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 sm:p-4 font-mono text-[#39FF14] text-sm">{stu.id}</td>
                        <td className="p-3 sm:p-4"><div className="font-bold text-sm sm:text-lg">{stu.name}</div>{stu.nickname && <div className="text-xs text-gray-400 font-mono">&raquo; {stu.nickname}</div>}</td>
                        <td className="p-3 sm:p-4 hidden md:table-cell"><div className="text-xs text-gray-400 font-mono truncate max-w-[180px]">{stu.email || '—'}</div></td>
                        <td className="p-3 sm:p-4 hidden sm:table-cell"><div className="text-[#00F0FF] font-bold text-sm">LVL {stu.level || 1}</div><div className="text-xs text-gray-400 font-mono">XP: {stu.xp || 0}</div></td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setEditStudent({ id: stu.id, name: stu.name, nickname: stu.nickname || '', email: stu.email || '' })} className="px-3 py-1.5 bg-[#00F0FF]/10 text-[#00F0FF] text-xs font-bold border border-[#00F0FF]/30 hover:bg-[#00F0FF] hover:text-black transition-colors rounded min-h-[36px]">DÜZENLE</button>
                            {!PROTECTED_IDS.includes(stu.id) && <button onClick={() => handleRemove(stu.id, stu.name)} className="px-3 py-1.5 bg-[#FF4500]/10 text-[#FF4500] text-xs font-bold border border-[#FF4500]/30 hover:bg-[#FF4500] hover:text-black transition-colors rounded min-h-[36px]">SİL</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {editStudent && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditStudent(null)} />
                  <div className="relative bg-[#0A1128] border border-[#00F0FF]/30 rounded-2xl p-6 w-full max-w-md z-[201] shadow-2xl">
                    <h3 className="text-[#00F0FF] text-lg font-bold mb-6 uppercase tracking-widest flex items-center gap-2"><span>✏️</span> Ajan Düzenle</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="editId" className="text-gray-400 text-xs font-mono block mb-1">ID (değiştirilemez)</label>
                        <input id="editId" type="text" disabled value={editStudent.id} className="bg-[#050505]/50 border border-gray-700 text-gray-500 p-3 w-full rounded font-mono cursor-not-allowed" />
                      </div>
                      <div>
                        <label htmlFor="editName" className="text-gray-400 text-xs font-mono block mb-1">İsim *</label>
                        <input id="editName" type="text" required value={editStudent.name} onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })} className="bg-[#050505] border border-gray-700 text-white p-3 w-full rounded focus:outline-none focus:border-[#00F0FF] transition-colors" />
                      </div>
                      <div>
                        <label htmlFor="editNick" className="text-gray-400 text-xs font-mono block mb-1">Takma Ad</label>
                        <input id="editNick" type="text" value={editStudent.nickname} onChange={(e) => setEditStudent({ ...editStudent, nickname: e.target.value })} className="bg-[#050505] border border-gray-700 text-white p-3 w-full rounded focus:outline-none focus:border-[#00F0FF] transition-colors" />
                      </div>
                      <div>
                        <label htmlFor="editMail" className="text-gray-400 text-xs font-mono block mb-1">E-posta</label>
                        <input id="editMail" type="email" value={editStudent.email} onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })} className="bg-[#050505] border border-gray-700 text-white p-3 w-full rounded focus:outline-none focus:border-[#00F0FF] transition-colors" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={handleSaveEdit} className="flex-1 bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF] px-4 py-3 font-bold transition-all uppercase tracking-widest rounded text-sm">Kaydet</button>
                      <button onClick={() => setEditStudent(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 border border-gray-700 px-4 py-3 font-bold transition-all uppercase tracking-widest rounded text-sm">İptal</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MESAJLAR */}
          {isAdmin && activeTab === 'mesajlar' && (
            <div className="max-w-2xl animate-fade-in">
              <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-4 sm:p-6 clip-path-diagonal relative">
                <div className="absolute top-0 right-0 px-4 py-1 bg-[#00F0FF] text-black text-xs font-bold tracking-widest">BROADCAST / DM</div>
                <h3 className="text-[#00F0FF] text-base sm:text-lg font-bold mb-2 uppercase tracking-widest">Global veya Özel Mesaj</h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-6">Hedef ID boş bırakılırsa Firestore 'messages' aracılığıyla tüm ajanlara yayınlanır. Hedef ID belirtilirse yalnızca o ajana bildirim olarak ulaşır.</p>
                <form onSubmit={handleSendMessage}>
                  <div className="mb-4">
                    <label className="block text-gray-400 text-xs font-mono mb-2">HEDEF AJAN ID (İsteğe Bağlı)</label>
                    <input type="text" value={messageTargetId} onChange={(e) => setMessageTargetId(e.target.value)} placeholder="Tüm Ajanlar (Boş Bırakın) veya örn: 1005" className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#00F0FF] font-mono text-sm transition-colors rounded" />
                  </div>
                  <textarea id="broadcastMsg" name="broadcastMsg" aria-label="Mesaj Kutusu" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Mesajınızı yazın..." required rows={4} className="w-full bg-[#050505] border border-gray-700 text-white p-4 focus:outline-none focus:border-[#00F0FF] font-mono text-sm mb-4 transition-colors resize-none rounded" />
                  <button type="submit" className="w-full bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF] py-3 font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2 rounded min-h-[48px]"><Icons.Message /> GÖNDER</button>
                </form>
              </div>
            </div>
          )}

          {isAdmin && activeTab === 'geribildirim' && (
            <div className="space-y-6 animate-fade-in">
              {feedbackLoading ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 animate-pulse text-lg">Yükleniyor...</div>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-gray-500">Henüz geri bildirim yok.</p>
                  <p className="text-gray-600 text-xs mt-2">Ders bittikten 15 dakika sonra öğrenciler formu doldurabiliyor.</p>
                </div>
              ) : (
                Object.entries(groupedFeedback)
                  .sort(([a], [b]) => b.localeCompare(a)) // En yeni ders önce
                  .map(([date, entries]) => {
                    const avgRating = entries.reduce((s, e) => s + e.rating, 0) / entries.length;
                    const lessonNo = entries[0]?.lessonNo;
                    return (
                      <div key={date} className="bg-[#0A1128]/80 border border-[#6358cc]/30 rounded-xl overflow-hidden">
                        {/* Ders başlık satırı */}
                        <div className="bg-[#6358cc]/10 px-5 py-4 border-b border-[#6358cc]/20 flex flex-wrap items-center gap-4">
                          <div>
                            <h3 className="text-[#8b7fd8] font-black text-base uppercase tracking-widest">
                              {lessonNo ? `Ders ${lessonNo}` : formatLessonDate(date)}
                            </h3>
                            <p className="text-gray-600 text-xs font-mono">{formatLessonDate(date)}</p>
                          </div>
                          <div className="ml-auto flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-white">{entries.length}</div>
                              <div className="text-gray-600 text-xs">form</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-yellow-400 flex items-center gap-1">
                                {avgRating.toFixed(1)} ⭐
                              </div>
                              <div className="text-gray-600 text-xs">ortalama</div>
                            </div>
                            {/* Yıldız dağılımı */}
                            <div className="hidden sm:flex flex-col gap-0.5">
                              {[5,4,3,2,1].map(star => {
                                const count = entries.filter(e => e.rating === star).length;
                                const pct = entries.length ? Math.round((count / entries.length) * 100) : 0;
                                return (
                                  <div key={star} className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-gray-500 w-3 text-right">{star}</span>
                                    <span className="text-yellow-500 text-[8px]">★</span>
                                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-yellow-400/70 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-gray-600 w-4">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Geri bildirim tablosu */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-800 text-[11px] font-mono text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-2 font-normal">#</th>
                                <th className="px-4 py-2 font-normal">Puan</th>
                                <th className="px-4 py-2 font-normal">Yorum</th>
                                <th className="px-4 py-2 font-normal hidden sm:table-cell text-right">Saat</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                              {entries.map((fb, i) => (
                                <tr key={fb.id} className="hover:bg-white/3 transition-colors">
                                  <td className="px-4 py-3 text-gray-600 text-xs font-mono">{i + 1}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-0.5">
                                      {[1,2,3,4,5].map(s => (
                                        <span key={s} className={`text-base ${s <= fb.rating ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-gray-300 text-sm max-w-xs">
                                    {fb.comment
                                      ? <span className="italic">"{fb.comment}"</span>
                                      : <span className="text-gray-700">—</span>
                                    }
                                  </td>
                                  <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-xs font-mono text-right whitespace-nowrap">
                                    {new Date(fb.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {isAdmin && activeTab === 'yoklama' && <AttendancePage students={students} />}
          {isAdmin && activeTab === 'arsiv' && <ArchiveManager isAdmin={isAdmin} />}

          {/* TAB: CİHAZ İSTATİSTİKLERİ */}
          {isAdmin && activeTab === 'cihazlar' && (() => {
            // Gruplama işlemleri:
            const total = loginAlerts.length;
            const browsers: Record<string, number> = {};
            const devices: Record<string, number> = {};
            
            // Eğer giriş yapan öğrenci login_alerts'te yoksa, o kişileri bilinmeyen kategorisinde ekleyebiliriz (email onayı vs.)
            const loggedStudentIds = new Set(loginAlerts.map(a => a.student_id));
            const unverifiedOrUnknownCount = students.filter(s => !loggedStudentIds.has(s.id)).length;

            loginAlerts.forEach(a => {
              const b = a.browser || 'Diğer';
              browsers[b] = (browsers[b] || 0) + 1;
              const d = a.device_name || (a.is_desktop ? 'Masaüstü (PC/Mac)' : 'Telefon/Tablet');
              devices[d] = (devices[d] || 0) + 1;
            });

            if (unverifiedOrUnknownCount > 0) {
              devices['Bilinmeyen Cihaz / Doğrulanmamış'] = (devices['Bilinmeyen Cihaz / Doğrulanmamış'] || 0) + unverifiedOrUnknownCount;
            }

            return (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-[#0A1128]/80 border border-[#6358cc]/30 p-6 rounded-xl">
                  <h3 className="text-[#6358cc] font-bold text-lg uppercase tracking-wider mb-6">📡 Gerçek Zamanlı Cihaz Dağılımı</h3>
                  {total === 0 && unverifiedOrUnknownCount === 0 ? (
                    <div className="p-8 text-center text-gray-500 animate-pulse">Veri toplanıyor...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {Object.entries(devices).map(([label, count], i) => (
                          <div key={label} className="bg-[#050505]/80 border border-gray-800 rounded-lg p-5 text-center transition-all hover:border-[#00F0FF]/50">
                            <div className="text-3xl font-bold mb-1 text-[#00F0FF]">{count}</div>
                            <div className="text-xs text-gray-500">{label}</div>
                          </div>
                        ))}
                      </div>
                      <h4 className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-3">Tarayıcı Motoru Dağılımı</h4>
                      <div className="space-y-3">
                        {Object.entries(browsers).map(([bName, bCount]) => {
                          const pct = Math.round((bCount / total) * 100);
                          return (
                            <div key={bName} className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-52 shrink-0">{bName}</span>
                              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all bg-[#39FF14]" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-bold font-mono w-8 text-right text-[#39FF14]">% {pct}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB: ANKET */}
          {isAdmin && activeTab === 'anket' && (
            <SurveyManager />
          )}



        </div>
      </main>

      {!isAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A1128] border-t border-[#00F0FF]/20 z-20 flex items-center justify-around px-2 py-2 safe-area-bottom">
          <button onClick={() => setActiveTab('genel')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px] min-h-[56px] ${activeTab === 'genel' ? 'text-[#00F0FF]' : 'text-gray-500'}`}><Icons.Home /><span className="text-[10px] font-bold">ANA SAYFA</span></button>
          <button onClick={() => setDrawerOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#6358cc]/20 text-[#8b7fd8] min-w-[60px] min-h-[56px]"><Icons.Target /><span className="text-[10px] font-bold">OPERASYON</span></button>
        </div>
      )}
    </div>
  );
};
