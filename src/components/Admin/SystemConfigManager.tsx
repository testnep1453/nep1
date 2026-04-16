import { useState, useEffect } from 'react';
import { ShieldAlert, Radio, Trash2, Plus, Users, Globe, Settings2 } from 'lucide-react';
import { getSystemConfig, saveSystemConfig, SystemConfig } from '../../services/systemSettingsService';

export const SystemConfigManager = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [targetedUserId, setTargetedUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemConfig().then(cfg => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!config) return;
    setSaving(true);
    await saveSystemConfig(config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addTargetedUser = () => {
    if (!targetedUserId || !config) return;
    if (!config.maintenance_mode.targeted_users.includes(targetedUserId)) {
      setConfig({
        ...config,
        maintenance_mode: {
          ...config.maintenance_mode,
          targeted_users: [...config.maintenance_mode.targeted_users, targetedUserId]
        }
      });
    }
    setTargetedUserId('');
  };

  const removeTargetedUser = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      maintenance_mode: {
        ...config.maintenance_mode,
        targeted_users: config.maintenance_mode.targeted_users.filter(u => u !== id)
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#00F0FF] animate-pulse space-y-4">
        <Settings2 className="w-12 h-12 animate-spin" />
        <span className="font-mono tracking-widest uppercase text-sm">Sistem Parametreleri Yükleniyor...</span>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* 1. OPERASYONEL AYARLAR */}
      <section className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#00F0FF]" /> Operasyonel Ayarlar
          </h3>
          <span className="text-[10px] bg-[#39FF14]/10 text-[#39FF14] px-2 py-0.5 rounded border border-[#39FF14]/20 uppercase font-bold">Aktif Değerler</span>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 block font-bold">Zoom Linki</label>
              <input
                type="url"
                value={config.zoom_link}
                onChange={e => setConfig({ ...config, zoom_link: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F0FF] outline-none transition-all font-mono text-[#00F0FF]"
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 block font-bold">Ders Başlığı</label>
              <input
                type="text"
                value={config.lesson_title}
                onChange={e => setConfig({ ...config, lesson_title: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#00F0FF] outline-none transition-all font-bold"
                placeholder="Örn: NEP HAFTALIK OPERASYON"
              />
            </div>
          </div>

          <div className="flex border-t border-white/5 pt-6">
            <button 
              onClick={() => setConfig({ ...config, login_alerts_enabled: !config.login_alerts_enabled })}
              className={`flex items-center gap-4 px-6 py-3 rounded-xl border-2 transition-all ${
                config.login_alerts_enabled 
                  ? 'bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14]' 
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div className={`w-3 h-3 rounded-full animate-pulse ${config.login_alerts_enabled ? 'bg-[#39FF14]' : 'bg-slate-600'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">Cihaz Giriş Logları: {config.login_alerts_enabled ? 'AKTİF' : 'PASİF'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. GELİŞMİŞ BAKIM MODU (HEDEFLİ) */}
      <section className="bg-black/40 border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl relative">
        {!config.maintenance_mode.global && config.maintenance_mode.targeted_users.length === 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-40">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            <span className="text-[8px] font-bold text-slate-400 uppercase">Erişim Serbest</span>
          </div>
        )}
        
        <div className="px-6 py-4 bg-red-500/5 border-b border-red-500/10 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Gelişmiş Bakım Modu
          </h3>
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-slate-500 font-medium">ADMIN (1002) DAİMA BYPASS EDER</span>
          </div>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Global Bakım */}
          <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${config.maintenance_mode.global ? 'bg-red-500 text-white border-red-400' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-tight">Global Sistem Kapatma</p>
                <p className="text-xs text-slate-500">Tüm öğrencilerin sisteme erişimi engellenir.</p>
              </div>
            </div>
            <button 
              onClick={() => setConfig({ ...config, maintenance_mode: { ...config.maintenance_mode, global: !config.maintenance_mode.global } })}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-all border-2 ${
                config.maintenance_mode.global 
                  ? 'bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-red-500/30'
              }`}
            >
              {config.maintenance_mode.global ? 'SİSTEM KAPALI' : 'SİSTEM AÇIK'}
            </button>
          </div>

          {/* Hedefli Bakım */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-orange-400" />
              <h4 className="text-xs font-black uppercase tracking-widest text-orange-400">Hedefli Engelleme (Kişisel Bakım)</h4>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Hedef Ajan ID (Örn: 1054)"
                value={targetedUserId}
                onChange={e => setTargetedUserId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTargetedUser()}
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all font-mono"
              />
              <button 
                onClick={addTargetedUser}
                className="px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {config.maintenance_mode.targeted_users.map(id => (
                <div key={id} className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg text-orange-400 font-mono text-xs group">
                  <span>ID: {id}</span>
                  <button onClick={() => removeTargetedUser(id)} className="hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {config.maintenance_mode.targeted_users.length === 0 && (
                <p className="text-[10px] text-slate-600 italic">Şu an hedeflenmiş bir engel bulunmuyor.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. ACİL DURUM YAYINI */}
      <section className="bg-[#1a0a0a] border border-red-900/40 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.1)]">
        <div className="px-6 py-4 bg-red-900/20 border-b border-red-900/30 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" /> Acil Durum Yayını (Broadcast)
          </h3>
          <span className="text-[10px] text-red-500/80 font-bold animate-pulse">CANLI SİNYAL</span>
        </div>
        
        <div className="p-6">
          <textarea
            value={config.broadcast_message}
            onChange={e => setConfig({ ...config, broadcast_message: e.target.value })}
            placeholder="Tüm ajanların ekranında görünecek acil durum mesajını buraya yazın..."
            className="w-full bg-black/40 border border-red-900/30 rounded-xl px-4 py-4 text-sm focus:border-red-500 outline-none transition-all min-h-[100px] text-red-200 placeholder:text-red-900/60 font-medium leading-relaxed"
          ></textarea>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-[10px] text-red-900/60 font-bold uppercase flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
               Tüm istemcilere eş zamanlı iletilir
            </div>
            <button 
              onClick={() => handleSave()}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] disabled:opacity-50"
            >
              {saving ? 'GÖNDERİLİYOR...' : 'YAYINLA'}
            </button>
          </div>
        </div>
      </section>

      {/* GLOBAL KAYDET BUTONU */}
      <div className="sticky bottom-6 flex justify-center pt-4 z-50">
         <button
            onClick={() => handleSave()}
            disabled={saving}
            className={`px-12 py-4 font-black transition-all uppercase tracking-[0.3em] rounded-2xl border-2 text-sm shadow-2xl ${
              saved 
                ? 'bg-[#39FF14] text-black border-white scale-105' 
                : 'bg-[#00F0FF] text-black border-white hover:bg-white hover:text-black hover:scale-105'
            } disabled:opacity-50`}
          >
            {saving ? 'İŞLENİYOR...' : saved ? '✓ SİSTEM GÜNCELLENDİ' : 'TÜM AYARLARI MERKEZE GÖNDER'}
          </button>
      </div>

    </div>
  );
};
