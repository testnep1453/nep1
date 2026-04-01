import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  getStudentsFromFirebase, addStudentToFirebase, addStudentsBatch, removeStudentFromFirebase,
  addMessageToFirebase, setTrailer, disableTrailer, subscribeToTrailer, extractYoutubeId
} from '../../services/dbFirebase';
import { recordAttendance } from '../../services/db';
import { Student, Lesson, Trailer } from '../../types/student';
import { ProfileSection } from './ProfileSection';
import { PresenceCounter } from './PresenceCounter';
import { MessageFeed } from './MessageFeed';
import { CircularCountdown } from '../Countdown/CircularCountdown';
import { JoinClassButton } from '../Countdown/JoinClassButton';
import { YouTubePlayer } from '../VideoTheater/YouTubePlayer';

const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 8.71l-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105"/><path d="M16 15c-2.21 1.333-5.792 1.333-8 0"/></svg>,
  Swords: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 9.5l-9 9M9.5 14.5l-4-4M16 8l4-4M16 8a2 2 0 0 0 -2.828 -2.828L8 10l-4 4 4 4 4-4 4.828-5.172A2 2 0 0 0 16 8z"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/></svg>,
  Message: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"/><path d="M9 12h12l-3 -3"/><path d="M18 15l3 -3"/></svg>,
  Film: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M7 15h10"/><path d="M7 7.5h10"/></svg>,
  UserX: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0 -4 -4H6a4 4 0 0 0 -4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

// Hafta hesaplama: iki tarih arasındaki hafta farkı
const weeksBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (7 * 24 * 60 * 60 * 1000));
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
  const [activeTab, setActiveTab] = useState<'genel' | 'operasyon' | 'fragman' | 'ajanlar' | 'mesajlar' | 'devamsiz'>(
    isAdmin ? 'genel' : 'genel'
  );

  // --- Otomatik XP Kaydı (ilk girişte) ---
  const attendanceRecorded = useRef(false);
  useEffect(() => {
    if (student && !attendanceRecorded.current) {
      attendanceRecorded.current = true;
      const result = recordAttendance(student.id);
      if (result && result.xpEarned > 0) {
        console.log(`Katılım kaydedildi: +${result.xpEarned} XP, Seri: ${result.streak} hafta`);
      }
    }
  }, [student?.id]);

  // Admin State
  const [students, setStudents] = useState<Student[]>([]);
  const [messageText, setMessageText] = useState('');

  // Fragman State
  const [trailer, setTrailerState] = useState<Trailer | null>(null);
  const [trailerYoutubeUrl, setTrailerYoutubeUrl] = useState('');
  const [trailerShowDate, setTrailerShowDate] = useState('');
  const [trailerShowTime, setTrailerShowTime] = useState('');

  // Excel State
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Devamsızlık State
  const [selectedAbsentee, setSelectedAbsentee] = useState<Student | null>(null);
  const [absenteeMessage, setAbsenteeMessage] = useState('');

  // Öğrenci Fragman İzleme Takibi
  const [hasWatchedTrailer, setHasWatchedTrailer] = useState(false);

  // Fragman zamanı kontrol fonksiyonu
  const isTrailerActiveNow = useCallback((t: Trailer | null): boolean => {
    if (!t || !t.isActive || !t.youtubeId || !t.showDate || !t.showTime) return false;
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    // Fragman tarihi bugünse ve saati geçmişse aktif
    return t.showDate === current && currentTime >= t.showTime;
  }, []);

  useEffect(() => {
    if (isAdmin) {
      getStudentsFromFirebase().then(setStudents);
    }
  }, [isAdmin]);

  // Fragman dinleme
  useEffect(() => {
    const unsub = subscribeToTrailer((t) => {
      setTrailerState(t);
    });
    return () => { unsub && unsub(); };
  }, []);

  // --- Fragman Kaydetme (Admin) ---
  const handleSetTrailer = async () => {
    const videoId = extractYoutubeId(trailerYoutubeUrl);
    if (!videoId) { alert('Geçerli bir YouTube linki girin.'); return; }
    if (!trailerShowDate || !trailerShowTime) { alert('Gösterim tarihini ve saatini belirleyin.'); return; }
    await setTrailer({ youtubeId: videoId, showDate: trailerShowDate, showTime: trailerShowTime });
    setTrailerYoutubeUrl('');
    setUploadMessage('Fragman kaydedildi!');
    setTimeout(() => setUploadMessage(''), 3000);
  };

  // --- Fragman Kaldırma (Admin) ---
  const handleRemoveTrailer = async () => {
    await disableTrailer();
    setUploadMessage('Fragman kaldırıldı.');
    setTimeout(() => setUploadMessage(''), 3000);
  };

  // --- Excel Yükleme ---
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

        if (!id || !name) continue;
        if (validRows.some(s => s.id === id)) continue;

        validRows.push({
          id,
          name,
          nickname: nickname || undefined,
          xp: 0,
          level: 1,
          badges: [],
          avatar: 'hero_1',
          lastSeen: Date.now(),
          attendanceHistory: [],
          streak: 0,
        });
      }

      if (validRows.length === 0) {
        setUploadMessage('Excel dosyasında geçerli veri bulunamadı. Sütun lar: ID, İsim, Kod (opsiyonel)');
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
      setUploadMessage(`${newStudents.length} öğrenci başarıyla eklendi!`);
      setStudents(await getStudentsFromFirebase());

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadMessage('Excel dosyası okunamadı: ' + (err as Error).message);
    }
    setTimeout(() => setUploadMessage(''), 5000);
  };

  // --- Tek Öğrenci Ekleme ---
  const [newStudent, setNewStudent] = useState({ id: '', name: '', nickname: '' });
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.id || !newStudent.name) return;
    if (students.some(s => s.id === newStudent.id)) {
      alert('Bu ID zaten sistemde mevcut!');
      return;
    }
    const newS: Student = {
      ...newStudent,
      xp: 0, level: 1, badges: [], avatar: 'hero_1',
      lastSeen: Date.now(),
      attendanceHistory: [], streak: 0,
    };
    await addStudentToFirebase(newS);
    setStudents(await getStudentsFromFirebase());
    setNewStudent({ id: '', name: '', nickname: '' });
  };

  // --- Öğrenci Silme ---
  const handleRemove = async (id: string, name: string) => {
    if (window.confirm(`Ajan ${name} (${id}) sistemden kalıcı olarak silinecek. Onaylıyor musunuz?`)) {
      await removeStudentFromFirebase(id);
      setStudents(await getStudentsFromFirebase());
    }
  };

  // --- Devamsızlara Mesaj Gönder ---
  const handleSendAbsenteeMessage = async () => {
    if (!selectedAbsentee || !absenteeMessage.trim()) return;
    // Admin'in özel mesajını Firestore'a gönder
    await addMessageToFirebase(`📌 ${selectedAbsentee.name} (${selectedAbsentee.id}) için özel mesaj: ${absenteeMessage.trim()}`);
    setAbsenteeMessage('');
    alert(`${selectedAbsentee.name} için mesaj gönderildi.`);
  };

  // --- Devamsız Öğrencileri Bul (3+ hafta gelmeyen) ---
  const getAbsentStudents = (): { student: Student; weeksSince: number }[] => {
    if (!isAdmin) return [];
    const today = new Date();
    return students
      .map(s => {
        const history = (s as any).attendanceHistory || [];
        const lastDate = history.length > 0 ? history[history.length - 1].date : null;
        const weeksSince = lastDate ? weeksBetween(lastDate, today.toISOString().slice(0, 10)) : 999;
        return { student: s, weeksSince };
      })
      .filter(x => x.weeksSince >= 3)
      .sort((a, b) => b.weeksSince - a.weeksSince)
      .slice(0, 20);
  };

  // --- Global Mesaj Gönderme ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      await addMessageToFirebase(messageText.trim());
      setMessageText('');
      alert('İstihbarat tüm ajanlara başarıyla iletildi!');
    }
  };

  // --- Fragman İzleme Tamamlandı ---
  const handleTrailerComplete = () => {
    setHasWatchedTrailer(true);
  };

  const absentStudents = getAbsentStudents();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-['Rajdhani',sans-serif] selection:bg-[#39FF14]/30 overflow-hidden">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
        <div className="scanlines absolute inset-0"></div>
      </div>

      {/* Vertical Navigation */}
      <aside className="w-full md:w-64 bg-[#0A1128] border-b md:border-b-0 md:border-r border-[#39FF14]/20 z-10 flex flex-col md:h-screen sticky top-0 md:overflow-y-auto">
        <div className="p-6 border-b border-[#39FF14]/20 flex items-center gap-3">
          <div className={`w-10 h-10 ${isAdmin ? 'bg-[#39FF14]/10 border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'bg-[#00F0FF]/10 border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]'} rounded flex items-center justify-center border`}>
            {isAdmin ? <span className="text-xl">👑</span> : <span className="text-xl">🛡️</span>}
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isAdmin ? 'text-[#39FF14]' : 'text-[#00F0FF]'} tracking-widest leading-tight`}>
              {isAdmin ? <>KOMUTA<br/>MERKEZİ</> : <>AJAN<br/>PANELİ</>}
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto flex md:block flex-row gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('genel')}
            className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'genel' ? (isAdmin ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]' : 'bg-[#00F0FF]/10 text-[#00F0FF] border-l-4 border-[#00F0FF]') : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Icons.Home />
            <span className="font-semibold tracking-wide">Genel Durum</span>
          </button>

          <button
            onClick={() => setActiveTab('operasyon')}
            className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'operasyon' ? (isAdmin ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]' : 'bg-[#00F0FF]/10 text-[#00F0FF] border-l-4 border-[#00F0FF]') : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Icons.Swords />
            <span className="font-semibold tracking-wide">Operasyon Merkezi</span>
          </button>

          {/* Fragman Sekmesi: Herkes görür ama kilitli olabilir */}
          <button
            onClick={() => {
              const trailerActive = isTrailerActiveNow(trailer);
              if (!isAdmin && !trailerActive && !(trailer && trailer.isActive)) {
                alert('Fragman henüz aktif değil.');
                return;
              }
              setActiveTab('fragman');
            }}
            className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'fragman' ? (isAdmin ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]' : 'bg-[#00F0FF]/10 text-[#00F0FF] border-l-4 border-[#00F0FF]') : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            {isAdmin ? <Icons.Film /> : (isTrailerActiveNow(trailer) ? <Icons.Film /> : <Icons.Lock />)}
            <span className="font-semibold tracking-wide">Fragman</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('ajanlar')}
                className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'ajanlar' ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icons.Users />
                <span className="font-semibold tracking-wide">Ajan Yönetimi</span>
              </button>

              <button
                onClick={() => setActiveTab('devamsiz')}
                className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'devamsiz' ? 'bg-[#FFB000]/10 text-[#FFB000] border-l-4 border-[#FFB000]' : 'text-gray-400 hover:bg-white/5 hover:text-[#FFB000]'}`}
              >
                <Icons.UserX />
                <span className="font-semibold tracking-wide">Devamsız Ajanlar</span>
              </button>

              <button
                onClick={() => setActiveTab('mesajlar')}
                className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'mesajlar' ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icons.Message />
                <span className="font-semibold tracking-wide">İstihbarat Geri Dönüş</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-[#39FF14]/20">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full p-3 rounded-md text-[#FF4500] hover:bg-[#FF4500]/10 transition-all font-bold tracking-wide"
          >
            <Icons.Logout />
            Sistemi Kapat
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 z-10 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-sm tracking-[0.2em] uppercase mb-1 flex items-center gap-2 ${isAdmin ? 'text-[#39FF14]' : 'text-[#00F0FF]'}`}>
              <span className={`inline-block w-2 h-2 animate-pulse rounded-full ${isAdmin ? 'bg-[#39FF14]' : 'bg-[#00F0FF]'}`}></span>
              Güvenlik Seviyesi: {isAdmin ? 'YÖNETİCİ' : 'AJAN'}
            </h2>
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {activeTab === 'genel' && 'SİSTEM DURUMU'}
              {activeTab === 'operasyon' && 'AKTİF OPERASYON'}
              {activeTab === 'fragman' && (isAdmin ? 'FRAGMAN YÖNETİMİ' : 'GÖREV FRAGMANI')}
              {activeTab === 'ajanlar' && 'AJAN VERİTABANI'}
              {activeTab === 'devamsiz' && 'DEVAMSIZ AJANLAR'}
              {activeTab === 'mesajlar' && 'SİBER İSTİHBARAT AĞI'}
            </h1>
          </div>
          <div className="hidden md:block">
            <img
              src={`${import.meta.env.BASE_URL}nep-logo.png`}
              alt="NEP Logo"
              className="h-10 opacity-50 brightness-0 invert"
            />
          </div>
        </header>

        <div className="max-w-7xl mx-auto pb-20">

          {/* TAB: GENEL DURUM */}
          {activeTab === 'genel' && (
            <div className="space-y-8 animate-fade-in">
              {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#39FF14]/30 p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#39FF14]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"></div>
                    <h3 className="text-gray-400 text-sm tracking-widest mb-2 font-mono">TOPLAM AKTİF AJAN</h3>
                    <p className="text-5xl font-bold text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">{students.length || 0}</p>
                  </div>

                  <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#FFB000]/30 p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFB000]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"></div>
                    <h3 className="text-gray-400 text-sm tracking-widest mb-2 font-mono">SİSTEM DURUMU</h3>
                    <p className="text-3xl font-bold text-[#FFB000] mt-2 tracking-widest">STABİL</p>
                  </div>

                  <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#00F0FF]/30 p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#00F0FF]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"></div>
                    <h3 className="text-gray-400 text-sm tracking-widest mb-2 font-mono">CANLI KULLANICI</h3>
                    <p className="text-5xl font-bold text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">{onlineCount}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ProfileSection student={student} />
                </div>
                <div>
                  <PresenceCounter count={onlineCount} />
                </div>
              </div>

              <MessageFeed />
            </div>
          )}

          {/* TAB: OPERASYON MERKEZİ */}
          {activeTab === 'operasyon' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-[#0A1128]/80 border border-[#6358cc]/30 p-8 clip-path-diagonal">
                <h3 className="text-xl font-bold text-[#6358cc] mb-8 uppercase tracking-wider text-center">
                  ⏱️ HAFTALIK GÖREV PANELİ
                </h3>
                {lesson && (
                  <CircularCountdown
                    targetTime={lesson.startTime}
                    onComplete={() => {}}
                  />
                )}
                {lesson && (
                  <div className="py-6">
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
            </div>
          )}

          {/* TAB: FRAGMAN */}
          {activeTab === 'fragman' && (
            <div className="space-y-8 animate-fade-in">
              {/* Admin Fragman Yönetimi */}
              {isAdmin ? (
                <div>
                  <div className="bg-[#0A1128]/80 border border-[#F5D32E]/30 p-8 clip-path-diagonal mb-6">
                    <h3 className="text-xl font-bold text-[#F5D32E] mb-6 uppercase tracking-wider text-center">
                      🎬 FRAGMAN AYARLARI
                    </h3>

                    <div className="space-y-4 max-w-xl mx-auto">
                      <div>
                        <label className="text-gray-400 text-sm tracking-widest mb-1 block">YouTube Linki</label>
                        <input
                          type="text"
                          value={trailerYoutubeUrl}
                          onChange={(e) => setTrailerYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#F5D32E] font-mono transition-colors rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-gray-400 text-sm tracking-widest mb-1 block">Gösterim Tarihi</label>
                          <input
                            type="date"
                            value={trailerShowDate}
                            onChange={(e) => setTrailerShowDate(e.target.value)}
                            className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#F5D32E] transition-colors rounded"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-sm tracking-widest mb-1 block">Gösterim Saati</label>
                          <input
                            type="time"
                            value={trailerShowTime}
                            onChange={(e) => setTrailerShowTime(e.target.value)}
                            className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#F5D32E] transition-colors rounded"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleSetTrailer}
                          className="flex-1 bg-[#F5D32E]/20 hover:bg-[#F5D32E] text-[#F5D32E] hover:text-black border border-[#F5D32E] py-3 font-bold transition-all uppercase tracking-widest rounded"
                        >
                          Fragmanı Kaydet
                        </button>
                        {trailer && trailer.isActive && (
                          <button
                            onClick={handleRemoveTrailer}
                            className="bg-[#FF4500]/20 hover:bg-[#FF4500] text-[#FF4500] hover:text-black border border-[#FF4500] py-3 px-6 font-bold transition-all uppercase tracking-widest rounded"
                          >
                            Kaldır
                          </button>
                        )}
                      </div>

                      {trailer && trailer.isActive && (
                        <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded p-3 text-center">
                          <span className="text-[#39FF14] text-sm">Aktif Fragman: {trailer.youtubeId} — {trailer.showDate} / {trailer.showTime}</span>
                        </div>
                      )}

                      {uploadMessage && (
                        <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded p-3 text-center text-[#00F0FF] text-sm">
                          {uploadMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fragman Önizleme */}
                  {trailer && trailer.isActive && trailer.youtubeId && (
                    <div className="bg-[#0A1128]/80 border border-[#FF4500]/30 p-8 clip-path-diagonal">
                      <h3 className="text-xl font-bold text-[#FF4500] mb-6 uppercase tracking-wider text-center">
                        📺 FRAGMAN ÖNİZLEME
                      </h3>
                      <YouTubePlayer videoId={trailer.youtubeId} />
                    </div>
                  )}
                </div>
              ) : (
                /* Öğrenci Fragman Ekranı */
                isTrailerActiveNow(trailer) || (trailer && trailer.isActive) ? (
                  <div className="space-y-8">
                    <div className="bg-[#0A1128]/80 border border-[#F5D32E]/30 p-8 clip-path-diagonal">
                      <h3 className="text-xl font-bold text-[#F5D32E] mb-6 uppercase tracking-wider text-center">
                        🎬 GÖREV FRAGMANI
                      </h3>
                      {trailer && trailer.youtubeId && (
                        <>
                          <YouTubePlayer videoId={trailer.youtubeId} />
                          {!hasWatchedTrailer && (
                            <div className="text-center mt-6">
                              <button
                                onClick={handleTrailerComplete}
                                className="bg-[#F5D32E] hover:bg-[#D4A817] text-[#0A1628] font-bold py-4 px-10 rounded-full text-xl transition-all hover:shadow-[0_0_30px_rgba(245,211,46,0.3)]"
                              >
                                Fragmanı İzledim — Derse Git
                              </button>
                            </div>
                          )}
                          {hasWatchedTrailer && lesson && (
                            <div className="py-6">
                              <h2 className="text-2xl font-bold text-white text-center mb-6 uppercase tracking-wider">
                                {lesson.title}
                              </h2>
                              <JoinClassButton
                                zoomLink={lesson.zoomLink}
                                studentName={student.name}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0A1128]/80 border border-gray-800 p-12 clip-path-diagonal text-center">
                    <Icons.Lock />
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-gray-500 mb-2">FRAGMAN HENÜZ AKTİF DEĞİL</h3>
                    <p className="text-gray-600">Ders saati geldiğinde fragman burada açılacak.</p>
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB: AJAN YÖNETİMİ */}
          {isAdmin && activeTab === 'ajanlar' && (
            <div className="space-y-6 animate-fade-in">

              {/* Excel Yükleme */}
              <div className="bg-[#0A1128]/80 border border-[#F5D32E]/30 p-6 clip-path-diagonal">
                <h3 className="text-[#F5D32E] text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-xl">📊</span> Excel ile Toplu Ajan Ekle
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Excel dosyası formatı: Sütun A = ID, Sütun B = İsim, Sütun C = Kod (opsiyonel)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#F5D32E]/20 file:text-[#F5D32E] file:font-bold file:cursor-pointer hover:file:bg-[#F5D32E]/30 mb-3"
                />
                {uploadMessage && (
                  <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded p-3 text-center text-[#39FF14] text-sm">
                    {uploadMessage}
                  </div>
                )}
              </div>

              {/* Manuel Ekleme */}
              <div className="bg-[#0A1128]/80 border border-[#39FF14]/30 p-6 clip-path-diagonal">
                <h3 className="text-[#39FF14] text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-xl">+</span> Tekil Ajan Kayıt Formu
                </h3>
                <form onSubmit={handleAddStudent} className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="ID (Örn: 1004)"
                    required
                    value={newStudent.id}
                    onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })}
                    className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] font-mono w-full md:w-32 transition-colors rounded"
                  />
                  <input
                    type="text"
                    placeholder="Gerçek İsim"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] w-full transition-colors rounded"
                  />
                  <input
                    type="text"
                    placeholder="Gizli Kod (Nickname)"
                    value={newStudent.nickname}
                    onChange={(e) => setNewStudent({ ...newStudent, nickname: e.target.value })}
                    className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] w-full transition-colors rounded"
                  />
                  <button
                    type="submit"
                    className="bg-[#39FF14]/20 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14] px-6 py-3 font-bold transition-all uppercase tracking-widest whitespace-nowrap rounded"
                  >
                    Sisteme Ekle
                  </button>
                </form>
              </div>

              {/* Öğrenci Tablosu */}
              <div className="bg-[#0A1128]/60 border border-gray-800 overflow-x-auto rounded">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-700 font-mono text-gray-400 text-sm">
                      <th className="p-4 font-normal">ID</th>
                      <th className="p-4 font-normal">İSİM & NICKNAME</th>
                      <th className="p-4 font-normal">LEVEL & XP</th>
                      <th className="p-4 font-normal">SERİ</th>
                      <th className="p-4 font-normal text-right">OPERASYONLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {students.map((stu) => {
                      const stuStreak = (stu as any).streak || 0;
                      return (
                        <tr key={stu.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 font-mono text-[#39FF14]">{stu.id}</td>
                          <td className="p-4">
                            <div className="font-bold text-lg">{stu.name}</div>
                            {stu.nickname && <div className="text-xs text-gray-400 font-mono tracking-widest">» {stu.nickname}</div>}
                          </td>
                          <td className="p-4">
                            <div className="text-[#00F0FF] font-bold">LVL {stu.level || 1}</div>
                            <div className="text-xs text-gray-400 font-mono">XP: {stu.xp || 0}</div>
                          </td>
                          <td className="p-4">
                            <div className={`font-bold ${stuStreak >= 3 ? 'text-[#39FF14]' : 'text-gray-500'}`}>
                              {stuStreak >= 3 ? '🔥' : ''} {stuStreak} hafta
                            </div>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {stu.id !== '1002' && (
                              <button
                                onClick={() => handleRemove(stu.id, stu.name)}
                                className="px-3 py-1 bg-[#FF4500]/10 text-[#FF4500] text-xs font-bold border border-[#FF4500]/30 hover:bg-[#FF4500] hover:text-black transition-colors rounded"
                                title="Sistemden Sil"
                              >
                                İPTAL
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DEVAMSIZ AJANLAR */}
          {isAdmin && activeTab === 'devamsiz' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#0A1128]/80 border border-[#FFB000]/30 p-6 clip-path-diagonal">
                <h3 className="text-[#FFB000] text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-xl">⚠️</span> 3+ Hafta Gelmemiş Ajanlar
                </h3>

                {absentStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Harika! Tüm ajanlar düzenli katılıyor.</p>
                ) : (
                  <div className="grid gap-3 mb-8">
                    {absentStudents.map(({ student: st, weeksSince }) => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedAbsentee(st)}
                        className={`flex items-center justify-between p-4 rounded border transition-all text-left ${selectedAbsentee?.id === st.id ? 'border-[#FFB000] bg-[#FFB000]/10' : 'border-gray-700 bg-[#050505] hover:bg-white/5'}`}
                      >
                        <div>
                          <span className="font-bold">{st.name}</span>
                          <span className="text-gray-500 text-sm ml-3 font-mono">ID: {st.id}</span>
                        </div>
                        <span className="text-[#FFB000] font-bold">{weeksSince === 999 ? 'Hiç gelmedi' : `${weeksSince} hafta`}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedAbsentee && (
                  <div className="border-t border-[#FFB000]/20 pt-6 mt-4">
                    <h4 className="text-[#FFB000] font-bold mb-3">
                      {selectedAbsentee.name} için Özel Mesaj
                    </h4>
                    <textarea
                      value={absenteeMessage}
                      onChange={(e) => setAbsenteeMessage(e.target.value)}
                      placeholder="Mesajınızı yazın..."
                      rows={3}
                      className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#FFB000] rounded transition-colors resize-none mb-3"
                    />
                    <button
                      onClick={handleSendAbsenteeMessage}
                      disabled={!absenteeMessage.trim()}
                      className="bg-[#FFB000]/20 hover:bg-[#FFB000] text-[#FFB000] hover:text-black border border-[#FFB000] py-3 px-8 font-bold transition-all uppercase tracking-widest rounded disabled:opacity-50"
                    >
                      Mesajı Gönder
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MESAJLAR */}
          {isAdmin && activeTab === 'mesajlar' && (
            <div className="max-w-2xl animate-fade-in">
              <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-6 clip-path-diagonal relative">
                <div className="absolute top-0 right-0 px-4 py-1 bg-[#00F0FF] text-black text-xs font-bold tracking-widest">
                  BROADCAST
                </div>
                <h3 className="text-[#00F0FF] text-lg font-bold mb-2 uppercase tracking-widest">Global İstihbarat İletisi</h3>
                <p className="text-gray-400 text-sm mb-6">Buradan gönderdiğiniz bildiriler, Firestore üzerinden anında tüm ajanların 'Genel Durum' ekranlarına aktarılacaktır.</p>

                <form onSubmit={handleSendMessage}>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="İletmek istediğiniz istihbaratı buraya girin..."
                    required
                    rows={4}
                    className="w-full bg-[#050505] border border-gray-700 text-white p-4 focus:outline-none focus:border-[#00F0FF] font-mono text-sm mb-4 transition-colors resize-none rounded"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF] py-3 font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2 rounded"
                  >
                    <Icons.Message /> SİNYALİ GÖNDER
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
