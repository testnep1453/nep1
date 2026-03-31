import { useState, useEffect } from 'react';
import { getStudents, addStudent, removeStudent, updateStudent, addMessage } from '../../services/db';
import { Student } from '../../types/student';

// Icons as SVG strings to mimic Lucide/Tabler (no npm access)
const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 8.71l-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105"></path><path d="M16 15c-2.21 1.333-5.792 1.333-8 0"></path></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path></svg>,
  Message: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 9h8"></path><path d="M8 13h6"></path><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"></path></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"></path><path d="M9 12h12l-3 -3"></path><path d="M18 15l3 -3"></path></svg>
};

export const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'genel' | 'ajanlar' | 'mesajlar'>('genel');
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState({ id: '', name: '', nickname: '' });
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    setStudents(getStudents());
  }, []);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.id || !newStudent.name) return;
    
    // Check if ID exists
    if(students.some(s => s.id === newStudent.id)) {
      alert("Bu ID zaten sistemde mevcut!");
      return;
    }

    const student: Student = {
      ...newStudent,
      xp: 0,
      level: 1,
      badges: [],
      avatar: 'hero_1',
      lastSeen: Date.now()
    };
    addStudent(student);
    setStudents(getStudents());
    setNewStudent({ id: '', name: '', nickname: '' });
  };

  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`Ajan ${name} (${id}) sistemden kalıcı olarak silinecek. Onaylıyor musunuz?`)) {
      removeStudent(id);
      setStudents(getStudents());
    }
  };

  const handleAddXp = (id: string, currentXp: number, currentLevel: number) => {
    // Add 50 XP logic (simple level up logic for admin demo)
    const newXp = currentXp + 50;
    const newLevel = Math.floor(newXp / 200) + 1;
    updateStudent(id, { xp: newXp, level: Math.max(currentLevel, newLevel) });
    setStudents(getStudents());
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      addMessage(messageText.trim());
      setMessageText('');
      alert('İstihbarat tüm ajanlara başarıyla iletildi!');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-['Rajdhani',sans-serif] selection:bg-[#39FF14]/30 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
        <div className="scanlines absolute inset-0"></div>
      </div>

      {/* Vertical Navigation (Aside) */}
      <aside className="w-full md:w-64 bg-[#0A1128] border-b md:border-b-0 md:border-r border-[#39FF14]/20 z-10 flex flex-col md:h-screen sticky top-0">
        <div className="p-6 border-b border-[#39FF14]/20 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#39FF14]/10 rounded flex items-center justify-center border border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            <span className="text-xl">👑</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#39FF14] tracking-widest leading-tight">KOMUTA<br/>MERKEZİ</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto flex md:block flex-row gap-2 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('genel')}
            className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'genel' ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Icons.Home />
            <span className="font-semibold tracking-wide">Genel Durum</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('ajanlar')}
            className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'ajanlar' ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Icons.Users />
            <span className="font-semibold tracking-wide">Ajan Yönetimi</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('mesajlar')}
            className={`flex items-center gap-3 w-full md:w-auto p-3 rounded-md transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'mesajlar' ? 'bg-[#39FF14]/10 text-[#39FF14] border-l-4 border-[#39FF14]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Icons.Message />
            <span className="font-semibold tracking-wide">İstihbarat (Duyuru)</span>
          </button>
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

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 z-10 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-sm text-[#39FF14] tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-[#39FF14] animate-pulse rounded-full"></span>
            Güvenlik Seviyesi: Alpha
          </h2>
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {activeTab === 'genel' && 'Sistem Özeti'}
            {activeTab === 'ajanlar' && 'Ajan Veritabanı'}
            {activeTab === 'mesajlar' && 'Siber İstihbarat'}
          </h1>
        </header>

        {/* TAB: GENEL DURUM */}
        {activeTab === 'genel' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#39FF14]/30 p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#39FF14]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"></div>
              <h3 className="text-gray-400 text-sm tracking-widest mb-2 font-mono">TOPLAM AKTİF AJAN</h3>
              <p className="text-5xl font-bold text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">{students.length}</p>
            </div>
            
            <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#FFB000]/30 p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFB000]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"></div>
              <h3 className="text-gray-400 text-sm tracking-widest mb-2 font-mono">SİSTEM DURUMU</h3>
              <p className="text-3xl font-bold text-[#FFB000] mt-2 tracking-widest">STABİL</p>
            </div>

            <div className="clip-path-diagonal bg-[#0A1128]/80 border border-[#00F0FF]/30 p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#00F0FF]/5 rounded-bl-full transform origin-top-right group-hover:scale-150 transition-transform duration-500"></div>
              <h3 className="text-gray-400 text-sm tracking-widest mb-2 font-mono">SON YEDEKLEME</h3>
              <p className="text-2xl font-bold text-[#00F0FF] mt-3">Bugün, 09:00</p>
            </div>
          </div>
        )}

        {/* TAB: AJANLAR */}
        {activeTab === 'ajanlar' && (
          <div className="space-y-6">
            {/* Ekleme Formu */}
            <div className="bg-[#0A1128]/80 border border-[#39FF14]/30 p-6 clip-path-diagonal">
              <h3 className="text-[#39FF14] text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                <span className="text-xl">+</span> Yeni Ajan Kayıt Formu
              </h3>
              <form onSubmit={handleAddStudent} className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="ID (Örn: 1004)"
                  required
                  value={newStudent.id}
                  onChange={(e) => setNewStudent({...newStudent, id: e.target.value})}
                  className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] font-mono w-full md:w-32 transition-colors"
                />
                <input 
                  type="text" 
                  placeholder="Gerçek İsim"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] w-full transition-colors"
                />
                <input 
                  type="text" 
                  placeholder="Gizli Kod (Nickname)"
                  value={newStudent.nickname}
                  onChange={(e) => setNewStudent({...newStudent, nickname: e.target.value})}
                  className="bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#39FF14] w-full transition-colors"
                />
                <button 
                  type="submit"
                  className="bg-[#39FF14]/20 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14] px-6 py-3 font-bold transition-all uppercase tracking-widest whitespace-nowrap"
                >
                  Sisteme Ekle
                </button>
              </form>
            </div>

            {/* Ajan Listesi */}
            <div className="bg-[#0A1128]/60 border border-gray-800 overflow-x-auto">
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
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-mono text-[#39FF14]">{student.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-lg">{student.name}</div>
                        {student.nickname && <div className="text-xs text-gray-400 font-mono tracking-widest">» {student.nickname}</div>}
                      </td>
                      <td className="p-4">
                        <div className="text-[#00F0FF] font-bold">LVL {student.level}</div>
                        <div className="text-xs text-gray-400 font-mono">XP: {student.xp}</div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => handleAddXp(student.id, student.xp || 0, student.level || 1)}
                          className="px-3 py-1 bg-[#00F0FF]/10 text-[#00F0FF] text-xs font-bold border border-[#00F0FF]/30 hover:bg-[#00F0FF] hover:text-black transition-colors"
                          title="+50 XP Ekle"
                        >
                          +XP
                        </button>
                        {student.id !== '1002' && (
                          <button 
                            onClick={() => handleRemove(student.id, student.name)}
                            className="px-3 py-1 bg-[#FF4500]/10 text-[#FF4500] text-xs font-bold border border-[#FF4500]/30 hover:bg-[#FF4500] hover:text-black transition-colors"
                            title="Sistemden Sil"
                          >
                            İPTAL
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="p-8 text-center text-gray-500 font-mono">Sistemde ajan bulunamadı.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MESAJLAR */}
        {activeTab === 'mesajlar' && (
          <div className="max-w-2xl">
            <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-6 clip-path-diagonal relative">
              <div className="absolute top-0 right-0 px-4 py-1 bg-[#00F0FF] text-black text-xs font-bold tracking-widest">
                BROADCAST
              </div>
              <h3 className="text-[#00F0FF] text-lg font-bold mb-2 uppercase tracking-widest">Global İstihbarat İletisi</h3>
              <p className="text-gray-400 text-sm mb-6">Buradan gönderdiğiniz mesajlar, tüm ajanların şahsi ekranlarında "Önemli Sistem Mesajı" olarak belirecektir.</p>
              
              <form onSubmit={handleSendMessage}>
                <textarea 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="İletmek istediğiniz istihbaratı buraya girin..."
                  required
                  rows={4}
                  className="w-full bg-[#050505] border border-gray-700 text-white p-4 focus:outline-none focus:border-[#00F0FF] font-mono text-sm mb-4 transition-colors resize-none"
                />
                <button 
                  type="submit"
                  className="w-full bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF] py-3 font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Icons.Message /> SİNYALİ GÖNDER
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
