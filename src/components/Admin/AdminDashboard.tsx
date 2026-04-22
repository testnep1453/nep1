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
  Archive,
  Settings,
  PlusCircle,
  Download
} from 'lucide-react';
import { signOutUser } from '../../services/authService';
import { getStudents } from '../../services/clientStorageService';
import { requestNotificationPermission } from '../../services/fcm';
import { getSystemConfig } from '../../services/systemSettingsService';
import { AdminSecurityNotifier } from './AdminSecurityNotifier';
import { AttendancePage } from './AttendancePage';
import { SurveyManager } from './SurveyManager';
import { KnowledgeManager } from './KnowledgeManager';
import { ArchiveManager } from './ArchiveManager';
import { SystemConfigManager } from './SystemConfigManager';
import { subscribeToSettingStore } from '../../services/supabaseService';
import { setManualLessonActive } from '../../services/systemSettingsService';
import { SecurityLogs } from './SecurityLogs';

const LessonToggleButton = () => {
  const [manualLessonActive, setManualLessonActiveState] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getSystemConfig().then(cfg => {
      if (isMounted) setManualLessonActiveState(cfg.manual_lesson_active === true);
    });

    const unsub = subscribeToSettingStore<Record<string, unknown> | null>('system_config', null, (data) => {
      if (isMounted) setManualLessonActiveState(data?.manual_lesson_active === true);
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const handleToggleOverride = async () => {
    setOverrideLoading(true);
    try {
      const newVal = !manualLessonActive;
      await setManualLessonActive(newVal);
      setManualLessonActiveState(newVal);
    } catch (error) {
      console.error('Ders durumu değiştirilemedi:', error);
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleOverride}
      disabled={overrideLoading}
      className={`w-full py-6 text-center px-6 rounded-2xl mb-8 font-black text-xl md:text-2xl uppercase tracking-widest transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-4 border-2 shadow-2xl relative overflow-hidden disabled:opacity-50 ${
        manualLessonActive
          ? 'bg-[#39FF14] border-white text-black shadow-[0_0_80px_rgba(57,255,20,0.6)] scale-[1.02]'
          : 'bg-[#FF4500] border-black text-white shadow-[0_0_40px_rgba(255,69,0,0.4)] hover:bg-[#ff5511]'
      }`}
    >
      <div className="flex items-center gap-4 z-10 text-center flex-wrap justify-center">
        <span className="text-3xl md:text-4xl drop-shadow-lg">🚀</span>
        <span className="drop-shadow-sm flex flex-col items-center">
          DERSİ ŞİMDİ BAŞLAT
          <span className="text-sm opacity-80 mt-1">(ZORUNLU GEÇİŞ)</span>
        </span>
      </div>
      
      <span className={`md:absolute md:right-6 text-sm font-bold px-4 py-2 rounded-full z-10 shadow-inner mt-4 md:mt-0 ${
        manualLessonActive 
          ? 'bg-black text-[#39FF14] border border-black' 
          : 'bg-black/40 text-white border border-white'
      }`}>
        {overrideLoading 
          ? 'İŞLENİYOR...' 
          : manualLessonActive 
            ? 'DURUM: AÇIK — KAPAT' 
            : 'DURUM: KAPALI — AÇ'}
      </span>

      {manualLessonActive && (
        <div className="absolute inset-0 bg-white opacity-20 animate-pulse pointer-events-none" />
      )}
    </button>
  );
};


export const AdminDashboard: React.FC = () => {
  // YENİ: 'security' sekmesi eklendi ve archive'dan tamamen ayrıldı
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'surveys' | 'knowledge' | 'archive' | 'security' | 'config'>('overview');
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    const data = getStudents();
    setStudents(data);

    const enableNotifications = async () => {
      try {
        const token = await requestNotificationPermission();
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

          {/* SİSTEM AYARLARI */}
          <button 
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'config' ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Settings size={20} /> <span className="text-sm font-medium">Sistem Ayarları</span>
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
                  id="admin-student-search"
                  name="admin-student-search"
                  type="text"
                  placeholder="Öğrenci ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  aria-label="Öğrenci ara"
                  className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-[#39FF14]/50 outline-none w-64 transition-all"
                />
             </div>
             
             {/* YÜKLE BUTONU (PWA / İndir) */}
             <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#39FF14]/10 hover:bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30 transition-all font-bold text-xs">
                <Download size={16} />
                <span className="tracking-wider">YÜKLE</span>
             </button>

             {/* AYARLAR ÇARKI */}
             <button 
                onClick={() => setIsConfigModalOpen(true)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ffffff] hover:text-[#39FF14] hover:bg-white/10 transition-all group"
                title="Sistem Ayarları"
             >
                <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
             </button>

             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#39FF14] relative">
                <BellRing size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
             </div>
          </div>
        </header>

        {/* HER GÖRÜNÜMDE SABİT MANUEL DERS BUTONU */}
        <LessonToggleButton />

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
          {activeTab === 'config' && <SystemConfigManager />}
          
          {/* YENİ: GÜVENLİK MERKEZİ - Canlı Hata Radar Sistemi */}
          {activeTab === 'security' && <SecurityLogs />}
        </section>

        <AdminSecurityNotifier />

        <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-[#39FF14]/5 blur-[120px] rounded-full pointer-events-none" />
      </main>

      {/* SİSTEM AYARLARI TAM EKRAN MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsConfigModalOpen(false)} />
          
          <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-[#0A1128] border border-[#39FF14]/30 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(57,255,20,0.2)] mx-4">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#39FF14]/10 rounded-lg flex items-center justify-center border border-[#39FF14]/30">
                  <Settings className="text-[#39FF14] w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase">Sistem Ayarları</h2>
                  <p className="text-slate-500 text-xs">Genel operasyonel parametreleri yapılandırın.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <SystemConfigManager />
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all font-bold uppercase tracking-widest text-sm"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



