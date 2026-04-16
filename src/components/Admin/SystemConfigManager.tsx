/**
 * Sistem Konfigürasyon Yöneticisi (Admin)
 * 
 * Zoom linki, ders başlığı ve manuel ders override gibi hassas verileri
 * Supabase'deki settings tablosundan yönetir.
 */
import { useState, useEffect } from 'react';
import { getSystemConfig, saveSystemConfig, clearSystemConfigCache } from '../../services/systemSettingsService';

export const SystemConfigManager = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemConfig().then(cfg => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    await saveSystemConfig(config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleField = (field: keyof SystemConfig) => {
    if (!config) return;
    setConfig({ ...config, [field]: !config[field] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Sistem Konfigürasyonu ── */}
      <div className="bg-[#0A1128]/80 border border-[#00F0FF]/20 p-6 rounded-xl">
        <h3 className="text-[#00F0FF] text-lg font-bold mb-5 uppercase tracking-widest flex items-center gap-2">
          <span className="text-xl">⚙️</span> Sistem Konfigürasyonu
        </h3>
        
        {loading ? (
          <div className="text-center py-10 text-[#00F0FF] animate-pulse font-mono">
            SİSTEM VERİLERİ ÇEKİLİYOR...
          </div>
        ) : config && (
          <form onSubmit={handleSave} className="space-y-8 max-w-xl">
            {/* Input Grubu */}
            <div className="space-y-5">
              {/* Zoom Link */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block">
                  Zoom Toplantı Linki
                </label>
                <input
                  type="url"
                  placeholder="https://us06web.zoom.us/j/..."
                  value={config.zoom_link}
                  onChange={e => setConfig({ ...config, zoom_link: e.target.value })}
                  className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#00F0FF] rounded-lg transition-colors font-mono text-sm"
                />
              </div>

              {/* Ders Başlığı */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block">
                  Varsayılan Ders Başlığı
                </label>
                <input
                  type="text"
                  placeholder="NEP Haftalık Ders"
                  value={config.lesson_title}
                  onChange={e => setConfig({ ...config, lesson_title: e.target.value })}
                  className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#00F0FF] rounded-lg transition-colors"
                />
              </div>
            </div>

            {/* Toggle Grubu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              {/* Login Alerts Toggle */}
              <div 
                onClick={() => toggleField('login_alerts_enabled')}
                className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:border-[#00F0FF]/30 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">Giriş Uyarıları</p>
                  <p className="text-[10px] text-gray-500">Cihaz loglarını kaydet</p>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${config.login_alerts_enabled ? 'bg-[#39FF14]' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.login_alerts_enabled ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              {/* Maintenance Mode Toggle */}
              <div 
                onClick={() => toggleField('maintenance_mode')}
                className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:border-[#FF4500]/30 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">Bakım Modu</p>
                  <p className="text-[10px] text-gray-500">Sistemi erişime kapat</p>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${config.maintenance_mode ? 'bg-[#FF4500]' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.maintenance_mode ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className={`w-full md:w-auto px-10 py-4 font-black transition-all uppercase tracking-[0.2em] rounded-xl border-2 disabled:opacity-50 ${
                  saved 
                    ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]' 
                    : 'bg-[#00F0FF]/10 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border-[#00F0FF]'
                }`}
              >
                {saving ? 'İŞLENİYOR...' : saved ? '✓ SİSTEM GÜNCELLENDİ' : 'AYARLARI UYGULA'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
