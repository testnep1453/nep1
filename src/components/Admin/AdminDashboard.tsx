import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Database, 
  ShieldAlert, 
  LogOut, 
  Search,
  BellRing,
  LayoutDashboard,
  Archive
} from 'lucide-react';
import { signOutUser } from '../../services/authService';
import { getStudents } from '../../services/db';
import { requestPermission } from '../../services/fcm';
import { AdminSecurityNotifier } from './AdminSecurityNotifier';
import { AttendancePage } from './AttendancePage';
import { SurveyManager } from './SurveyManager';
import { KnowledgeManager } from './KnowledgeManager';
import { ArchiveManager } from './ArchiveManager';

export const AdminDashboard: React.FC = () => {
  // YENİ: 'security' sekmesi eklendi ve archive'dan tamamen ayrıldı
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'surveys' | 'knowledge' | 'archive' | 'security'>('overview');
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const data = getStudents();
    setStudents(data);

    const enableNotifications = async () => {
      try {
        const token = await requestPermission();
        if (token) {
          console.log('Bildirim izni alındı, kilit ekranı mesajları aktif.');
        }
      } catch (err) {
        console.error('Bildirim izni alınamadı:', err);
      }
    };
    enableNotifications();
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    window.location.reload();
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white flex overflow-hidden">
      <aside className="w-64 bg-black/40 border-r border-white/5 flex flex-col backdrop-blur-xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-[#39FF14]/10 rounded-lg flex items-center justify-center border border-[#39FF14]/30">
            <ShieldAlert className="text-[#39FF14] w-6 h-6" />
          </div>
          <span className="font-bold tracking-widest text-sm">NEP ADMIN</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <LayoutDashboard size={20} /> <span className="text-sm font-medium">Genel Bakış</span>
          </button>
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'attendance' ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Calendar size={20} /> <span className="text-sm font-medium">Yoklama Kayıtları</span>
          </button>
          <button 
            onClick={() => setActiveTab('surveys')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'surveys' ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <MessageSquare size={20} /> <span className="text-sm font-medium">Anket Yönetimi</span>
          </button>
          <button 
            onClick={() => setActiveTab('knowledge')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'knowledge' ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Database size={20} /> <span className="text-sm font-medium">Bilgi Bankası</span>
          </button>
          
          {/* ARŞİV SEKMESİ (SADECE ARŞİV) */}
          <button 
            onClick={() => setActiveTab('archive')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'archive' ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Archive size={20} /> <span className="text-sm font-medium">Sistem Arşivi</span>
          </button>
          
          {/* YENİ: GÜVENLİK SEKMESİ */}
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-4 ${activeTab === 'security' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-red-400'}`}
          >
            <ShieldAlert size={20} /> <span className="text-sm font-medium">Güvenlik Merkezi</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} /> <span className="text-sm font-medium">Güvenli Çıkış</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kontrol Merkezi</h1>
            <p className="text-slate-500 text-sm">Sistemin genel durumunu ve bildirimleri yönetin.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative flex items-center">
                <Search className="absolute left-3 text-slate-500" size={18} />
                <input 
                  type="text"
                  placeholder="Öğrenci ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-[#39FF14]/50 outline-none w-64 transition-all"
                />
             </div>
             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#39FF14] relative">
                <BellRing size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
             </div>
          </div>
        </header>

        <section className="animate-in fade-in duration-500">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl">
                <p className="text-slate-500 text-sm font-medium mb-1">Toplam Öğrenci</p>
                <h3 className="text-3xl font-bold">{students.length}</h3>
              </div>
              <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl">
                <p className="text-slate-500 text-sm font-medium mb-1">Aktif Oturumlar</p>
                <h3 className="text-3xl font-bold text-[#39FF14]">24</h3>
              </div>
              <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl">
                <p className="text-slate-500 text-sm font-medium mb-1">Bekleyen Bildirimler</p>
                <h3 className="text-3xl font-bold text-blue-400">12</h3>
              </div>

              <div className="col-span-1 md:col-span-3 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden mt-4">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h4 className="font-bold">Öğrenci Veritabanı</h4>
                  <button className="text-[#39FF14] text-xs font-bold uppercase tracking-wider hover:underline">Hepsini Gör</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">ID</th>
                        <th className="px-6 py-4 font-medium">İsim</th>
                        <th className="px-6 py-4 font-medium">XP</th>
                        <th className="px-6 py-4 font-medium">Seviye</th>
                        <th className="px-6 py-4 font-medium">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredStudents.slice(0, 10).map((student) => (
                        <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono text-[#39FF14]">{student.id}</td>
                          <td className="px-6 py-4 font-medium">{student.name}</td>
                          <td className="px-6 py-4 text-slate-400">{student.xp || 0}</td>
                          <td className="px-6 py-4 text-slate-400">{student.level || 1}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">Online</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && <AttendancePage />}
          {activeTab === 'surveys' && <SurveyManager />}
          {activeTab === 'knowledge' && <KnowledgeManager />}
          {activeTab === 'archive' && <ArchiveManager />}
          
          {/* YENİ: GÜVENLİK MERKEZİ (Güvenlik olaylarını burada detaylandırabiliriz) */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-red-400 flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8" /> Güvenlik Merkezi
                  </h3>
                  <p className="text-slate-500 mt-1">Siber tehditleri ve loglanmış şüpheli IP adreslerini yönetin.</p>
                </div>
              </div>
              <div className="bg-black/40 border border-white/5 p-8 rounded-2xl text-center">
                 <ShieldAlert className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                 <h4 className="text-xl font-bold text-white mb-2">Güvenlik Logları (Canlı)</h4>
                 <p className="text-slate-400 max-w-md mx-auto">
                   Gerçek zamanlı olarak tespit edilen hatalı giriş denemeleri sağ alt köşede bildirim olarak gelmeye devam edecektir.
                 </p>
              </div>
            </div>
          )}
        </section>

        <AdminSecurityNotifier />

        <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-[#39FF14]/5 blur-[120px] rounded-full pointer-events-none" />
      </main>
    </div>
  );
};
