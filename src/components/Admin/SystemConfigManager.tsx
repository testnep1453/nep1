/**
 * Sistem Konfigürasyon Yöneticisi (Admin)
 * 
 * Zoom linki, ders başlığı ve manuel ders override gibi hassas verileri
 * Supabase'deki settings tablosundan yönetir.
 */
import { useState, useEffect } from 'react';
import { getSystemConfig, saveSystemConfig, clearSystemConfigCache } from '../../services/systemSettingsService';

export const SystemConfigManager = () => {
  const [zoomLink, setZoomLink] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemConfig().then(cfg => {
      setZoomLink(cfg.zoomLink || '');
      setLessonTitle(cfg.lessonTitle || '');
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    clearSystemConfigCache();
    await saveSystemConfig({ zoomLink: zoomLink.trim(), lessonTitle: lessonTitle.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Sistem Konfigürasyonu ── */}
      <div className="bg-[#0A1128]/80 border border-[#00F0FF]/20 p-6 rounded-xl">
        <h3 className="text-[#00F0FF] text-lg font-bold mb-5 uppercase tracking-widest flex items-center gap-2">
          <span className="text-xl">⚙️</span> Sistem Konfigürasyonu
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Bu bilgiler Zoom linki ve ders ayarları gibi hassas verileri Supabase'de merkezi olarak depolar.
          Kod içinde hardcoded değer kalmaz.
        </p>

        {loading ? (
          <div className="text-center py-10 text-[#00F0FF] animate-pulse">Yükleniyor...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 max-w-xl">
            {/* Zoom Link */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">
                Zoom Toplantı Linki
              </label>
              <input
                type="url"
                placeholder="https://us06web.zoom.us/j/..."
                value={zoomLink}
                onChange={e => setZoomLink(e.target.value)}
                className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#00F0FF] rounded-lg transition-colors font-mono text-sm"
              />
              <p className="text-[10px] text-gray-600 mt-1">
                Değiştirdiğinizde tüm ajanların "Derse Katıl" butonu bu linki kullanır.
              </p>
            </div>

            {/* Ders Başlığı */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">
                Varsayılan Ders Başlığı
              </label>
              <input
                type="text"
                placeholder="NEP Haftalık Ders"
                value={lessonTitle}
                onChange={e => setLessonTitle(e.target.value)}
                className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#00F0FF] rounded-lg transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#00F0FF]/10 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF] px-8 py-3 font-bold transition-all uppercase tracking-widest rounded-lg disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi!' : 'Kaydet'}
            </button>
          </form>
        )}
      </div>

      {/* Bilgi kutusu */}
      <div className="bg-[#0A1128]/40 border border-gray-800 rounded-xl p-4 text-xs text-gray-500 space-y-1 font-mono">
        <p className="text-gray-400 font-bold mb-2">📋 Supabase Tablo Gereksinimleri</p>
        <p>• <span className="text-[#00F0FF]">settings</span> tablosunda {`id="system_config"`} satırı kullanılır</p>
        <p>• <span className="text-[#39FF14]">login_alerts</span> tablosu oluşturulduğunda loginAlertService içindeki <span className="text-[#FF4500]">LOGIN_ALERTS_ENABLED=false</span> → <span className="text-[#39FF14]">true</span> yap</p>
        <p>• <span className="text-[#00F0FF]">auto_messages_sent</span> → settings tablosunda saklanır (key: auto_messages_sent)</p>
      </div>
    </div>
  );
};
