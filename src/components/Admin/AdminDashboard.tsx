import { useState, useEffect, useCallback } from 'react';
import {
  getStudentsFromFirebase,
  addStudentToFirebase,
  removeStudentFromFirebase,
  updateStudentInFirebase,
  addMessageToFirebase,
} from '../../services/dbFirebase';
import { Student } from '../../types/student';

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icons = {
  Home: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 8.71l-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105"/>
      <path d="M16 15c-2.21 1.333-5.792 1.333-8 0"/>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/>
      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/>
    </svg>
  ),
  Message: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 9h8"/><path d="M8 13h6"/>
      <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"/>
    </svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"/>
      <path d="M9 12h12l-3 -3"/><path d="M18 15l3 -3"/>
    </svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  SelectAll: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
};

import { SurveyManager } from './SurveyManager';
import { KnowledgeManager } from './KnowledgeManager';

// ── Avatar emoji map ──────────────────────────────────────────────────────────────────────
const AVATARS: Record<string, string> = {
  hero_1: '🥷', hero_2: '🧑‍💻', hero_3: '👨‍🚀', hero_4: '🦺',
  default: '🤖',
};

// ── Component ──────────────────────────────────────────────────────────────────
export const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'genel' | 'ajanlar' | 'mesajlar' | 'anketler' | 'bilgi'>('genel');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({ id: '', name: '', nickname: '' });
  const [messageText, setMessageText] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  // ── Multi-select delete state ───────────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load students from Supabase ─────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudentsFromFirebase();
      setStudents(data);
    } catch (e) {
      showToast('Ajan listesi yüklenemedi!', 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // ── Add student ─────────────────────────────────────────────────────────────
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.id || !newStudent.name) return;
    if (students.some(s => s.id === newStudent.id)) {
      showToast('Bu ID zaten sistemde mevcut!', 'err');
      return;
    }
    const student: Student = {
      ...newStudent,
      xp: 0,
      level: 1,
      badges: [],
      avatar: 'hero_1',
      lastSeen: Date.now(),
    };
    try {
      await addStudentToFirebase(student);
      await loadStudents();
      setNewStudent({ id: '', name: '', nickname: '' });
      showToast(`Ajan ${student.name} sisteme eklendi ✓`, 'ok');
    } catch {
      showToast('Ajan eklenemedi!', 'err');
    }
  };

  // ── XP ekle ────────────────────────────────────────────────────────────────
  const handleAddXp = async (id: string, currentXp: number, currentLevel: number) => {
    const newXp = currentXp + 50;
    const newLevel = Math.max(currentLevel, Math.floor(newXp / 200) + 1);
    try {
      await updateStudentInFirebase(id, { xp: newXp, level: newLevel });
      setStudents(prev => prev.map(s => s.id === id ? { ...s, xp: newXp, level: newLevel } : s));
      showToast('+50 XP eklendi ✓');
    } catch {
      showToast('XP eklenemedi!', 'err');
    }
  };

  // ── Selection helpers ───────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    if (id === '1002') return; // admin korumalı
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const eligible = students.filter(s => s.id !== '1002').map(s => s.id);
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible));
    }
  };

  const cancelSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  // ── Bulk delete ─────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const names = students.filter(s => selected.has(s.id)).map(s => s.name).join(', ');
    if (!window.confirm(`${selected.size} ajan sistemden kalıcı olarak silinecek:\n\n${names}\n\nOnaylıyor musunuz?`)) return;

    setDeleting(true);
    try {
      await Promise.all([...selected].map(id => removeStudentFromFirebase(id)));
      setStudents(prev => prev.filter(s => !selected.has(s.id)));
      showToast(`${selected.size} ajan başarıyla silindi ✓`);
      cancelSelect();
    } catch (e) {
      showToast('Silme işlemi başarısız!', 'err');
    } finally {
      setDeleting(false);
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMsgSending(true);
    try {
      await addMessageToFirebase(messageText.trim());
      setMessageText('');
      showToast('İstihbarat tüm ajanlara iletildi ✓');
    } catch {
      showToast('Mesaj gönderilemedi!', 'err');
    } finally {
      setMsgSending(false);
    }
  };

  const eligibleCount = students.filter(s => s.id !== '1002').length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-['Rajdhani',sans-serif] selection:bg-[#39FF14]/30 overflow-hidden">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded font-bold tracking-wide shadow-lg border transition-all animate-[fadeIn_.2s_ease] ${
          toast.type === 'ok'
            ? 'bg-[#39FF14]/10 border-[#39FF14]/50 text-[#39FF14]'
            : 'bg-[#FF4500]/10 border-[#FF4500]/50 text-[#FF4500]'
        }`}>
          {toast.type === 'ok' ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"/>
        <div className="scanlines absolute inset-0"/>
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0A1128] border-b md:border-b-0 md:border-r border-[#39FF14]/20 z-10 flex flex-col md:h-screen sticky top-0">
        <div className="p-6 border-b border-[#39FF14]/20 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#39FF14]/10 rounded flex items-center justify-center border border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            <span className="text-xl">👑</span>
          </div>
          <h1 className="text-lg font-bold text-[#39FF14] tracking-widest leading-tight">KOMUTA<br/>MERKEZİ</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto flex md:block flex-row gap-2 overflow-x-auto">
          {(['genel', 'ajanlar', 'mesajlar', 'anketler', 'bilgi'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${
                activeTab === tab
                  ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab === 'genel' && <Icons.Home />}
              {tab === 'ajanlar' && <Icons.Users />}
              {tab === 'mesajlar' && <Icons.Message />}
              {tab === 'anketler' && <span className="text-xl">📋</span>}
              {tab === 'bilgi' && <span className="text-xl">📚</span>}
              <span className="font-semibold tracking-wide">
                {tab === 'genel' && 'Genel Durum'}
                {tab === 'ajanlar' && 'Ajan Yönetimi'}
                {tab === 'mesajlar' && 'İstihbarat (Duyuru)'}
                {tab === 'anketler' && 'Sorgu Odası'}
                {tab === 'bilgi' && 'Bilgi Odası'}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#39FF14]/20">
          <button onClick={onLogout} className="flex items-center gap-3 w-full p-3 rounded-md text-[#FF4500] hover:bg-[#FF4500]/10 transition-all font-bold tracking-wide">
            <Icons.Logout /> Sistemi Kapat
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 z-10 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-sm text-[#39FF14] tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[#39FF14] animate-pulse rounded-full"/>
            Güvenlik Seviyesi: Alpha
          </h2>
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {activeTab === 'genel' && 'Sistem Özeti'}
            {activeTab === 'ajanlar' && 'Ajan Veritabanı'}
            {activeTab === 'mesajlar' && 'Siber İstihbarat'}
            {activeTab === 'anketler' && 'Sorgu Odası Yönetimi'}
            {activeTab === 'bilgi' && 'Bilgi Odası Yönetimi'}
          </h1>
        </header>

        {/* ── TAB: BİLGİ ── */}
        {activeTab === 'bilgi' && (
          <div className="max-w-4xl">
            <KnowledgeManager />
          </div>
        )}

        {/* ── TAB: ANKETLER ── */}
        {activeTab === 'anketler' && (
          <div className="max-w-4xl">
            <SurveyManager />
          </div>
        )}

        {/* ── TAB: GENEL ── */}
        {activeTab === 'genel' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#39FF14]/30 p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#39FF14]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"/>
              <h3 className="text-gray-400 text-sm tracking-widest mb-2 font-mono">TOPLAM AKTİF AJAN</h3>
              <p className="text-5xl font-bold text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">{loading ? '…' : students.length}</p>
            </div>
            <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#FFB000]/30 p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFB000]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"/>
              <h3 className="text-gray-400 text-sm tracking-widest mb-2 font-mono">SİSTEM DURUMU</h3>
              <p className="text-3xl font-bold text-[#FFB000] mt-2 tracking-widest">STABİL</p>
            </div>
            <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#00F0FF]/30 p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#00F0FF]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"/>
              <h3 className="text-gray-400 text-sm tracking-widest mb-2 font-mono">VERİTABANI</h3>
              <p className="text-2xl font-bold text-[#00F0FF] mt-3">Supabase ✓</p>
            </div>
          </div>
        )}

        {/* ── TAB: AJANLAR ── */}
        {activeTab === 'ajanlar' && (
          <div className="space-y-6">

            {/* Yeni ajan formu */}
            <div className="bg-[#0A1128]/80 border border-[#39FF14]/30 p-6 clip-path-diagonal">
              <h3 className="text-[#39FF14] text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                <span className="text-xl">+</span> Yeni Ajan Kayıt Formu
              </h3>
              <form onSubmit={handleAddStudent} className="flex flex-col md:flex-row gap-4">
                <input
                  type="text" placeholder="ID (Örn: 1004)" required
                  value={newStudent.id}
                  onChange={e => setNewStudent({ ...newStudent, id: e.target.value })}
                  className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] font-mono w-full md:w-32 transition-colors"
                />
                <input
                  type="text" placeholder="Gerçek İsim" required
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] w-full transition-colors"
                />
                <input
                  type="text" placeholder="Gizli Kod (Nickname)"
                  value={newStudent.nickname}
                  onChange={e => setNewStudent({ ...newStudent, nickname: e.target.value })}
                  className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] w-full transition-colors"
                />
                <button type="submit" className="bg-[#39FF14]/20 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14] px-6 py-3 font-bold transition-all uppercase tracking-widest whitespace-nowrap">
                  Sisteme Ekle
                </button>
              </form>
            </div>

            {/* Toolbar: seçim modu */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-gray-500 font-mono text-sm">
                {loading ? 'Yükleniyor…' : `${students.length} ajan kayıtlı`}
                {selectMode && selected.size > 0 && (
                  <span className="ml-2 text-[#FF4500] font-bold">{selected.size} seçili</span>
                )}
              </p>
              <div className="flex gap-2">
                {!selectMode ? (
                  <button
                    onClick={() => setSelectMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/40 font-bold text-sm hover:bg-[#FF4500]/20 transition-colors"
                  >
                    <Icons.Trash /> Ajan Sil (Seç)
                  </button>
                ) : (
                  <>
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 border border-gray-700 font-bold text-sm hover:bg-white/10 transition-colors"
                    >
                      <Icons.SelectAll />
                      {selected.size === eligibleCount ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={selected.size === 0 || deleting}
                      className="flex items-center gap-2 px-4 py-2 bg-[#FF4500] text-black font-bold text-sm disabled:opacity-40 hover:bg-[#FF6030] transition-colors"
                    >
                      <Icons.Trash />
                      {deleting ? 'Siliniyor…' : `${selected.size} Ajanı Sil`}
                    </button>
                    <button
                      onClick={cancelSelect}
                      className="px-4 py-2 bg-white/5 text-gray-400 border border-gray-700 font-bold text-sm hover:bg-white/10 transition-colors"
                    >
                      İptal
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── PHOTO-GRID: seçim modu ── */}
            {selectMode && (
              <div>
                <p className="text-gray-500 font-mono text-xs mb-3 tracking-widest uppercase">
                  Silmek istediğin ajanları tıklayarak seç, sonra "Ajanı Sil" butonuna bas
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {students.map(student => {
                    const isProtected = student.id === '1002';
                    const isSelected = selected.has(student.id);
                    return (
                      <button
                        key={student.id}
                        disabled={isProtected}
                        onClick={() => toggleSelect(student.id)}
                        className={`relative p-4 rounded-lg border-2 transition-all text-left flex flex-col items-center gap-2
                          ${isProtected
                            ? 'border-[#39FF14]/30 bg-[#39FF14]/5 opacity-60 cursor-not-allowed'
                            : isSelected
                              ? 'border-[#FF4500] bg-[#FF4500]/15 shadow-[0_0_18px_rgba(255,69,0,0.4)] scale-[0.97]'
                              : 'border-gray-700 bg-[#0A1128]/60 hover:border-[#FF4500]/50 hover:bg-[#FF4500]/5'
                          }`}
                      >
                        {/* Checkmark overlay */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FF4500] flex items-center justify-center shadow-lg">
                            <Icons.Check />
                          </div>
                        )}
                        {isProtected && (
                          <div className="absolute top-2 right-2 text-[#39FF14] text-xs font-bold">👑</div>
                        )}
                        {/* Avatar */}
                        <span className="text-3xl">{AVATARS[student.avatar || 'default'] ?? '🤖'}</span>
                        {/* Info */}
                        <div className="text-center w-full">
                          <div className="font-bold text-sm text-white truncate w-full">{student.name}</div>
                          <div className="text-[#39FF14] font-mono text-xs">{student.id}</div>
                          {student.nickname && (
                            <div className="text-gray-500 text-xs truncate">» {student.nickname}</div>
                          )}
                          <div className="text-[#00F0FF] text-xs font-bold mt-1">LVL {student.level ?? 1}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TABLE: normal mod ── */}
            {!selectMode && (
              <div className="bg-[#0A1128]/60 border border-gray-800 overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center text-[#39FF14] font-mono animate-pulse">VERİTABANI TARANIYYOR…</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-900 border-b border-gray-700 font-mono text-gray-400 text-sm">
                        <th className="p-4 font-normal">ID</th>
                        <th className="p-4 font-normal">İSİM & NICKNAME</th>
                        <th className="p-4 font-normal">LEVEL & XP</th>
                        <th className="p-4 font-normal text-right">OPERASYONLAR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {students.map(student => (
                        <tr key={student.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono text-[#39FF14]">{student.id}</td>
                          <td className="p-4">
                            <div className="font-bold text-lg">{student.name}</div>
                            {student.nickname && (
                              <div className="text-xs text-gray-400 font-mono tracking-widest">» {student.nickname}</div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-[#00F0FF] font-bold">LVL {student.level ?? 1}</div>
                            <div className="text-xs text-gray-400 font-mono">XP: {student.xp ?? 0}</div>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleAddXp(student.id, student.xp ?? 0, student.level ?? 1)}
                              className="px-3 py-1 bg-[#00F0FF]/10 text-[#00F0FF] text-xs font-bold border border-[#00F0FF]/30 hover:bg-[#00F0FF] hover:text-black transition-colors"
                              title="+50 XP Ekle"
                            >
                              +XP
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!loading && students.length === 0 && (
                  <div className="p-8 text-center text-gray-500 font-mono">Sistemde ajan bulunamadı.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: MESAJLAR ── */}
        {activeTab === 'mesajlar' && (
          <div className="max-w-2xl">
            <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-6 clip-path-diagonal relative">
              <div className="absolute top-0 right-0 px-4 py-1 bg-[#00F0FF] text-black text-xs font-bold tracking-widest">
                BROADCAST
              </div>
              <h3 className="text-[#00F0FF] text-lg font-bold mb-2 uppercase tracking-widest">Global İstihbarat İletisi</h3>
              <p className="text-gray-400 text-sm mb-6">
                Buradan gönderdiğiniz mesajlar, tüm ajanların şahsi ekranlarında "Önemli Sistem Mesajı" olarak belirecektir.
              </p>
              <form onSubmit={handleSendMessage}>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="İletmek istediğiniz istihbaratı buraya girin..."
                  required rows={4}
                  className="w-full bg-[#050505] border border-gray-700 text-white p-4 focus:outline-none focus:border-[#00F0FF] font-mono text-sm mb-4 transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={msgSending}
                  className="w-full bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF] py-3 font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Icons.Message /> {msgSending ? 'GÖNDERİLİYOR…' : 'SİNYALİ GÖNDER'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
