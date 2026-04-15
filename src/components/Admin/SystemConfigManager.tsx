/**
 * Sistem Konfigürasyon Yöneticisi (Admin)
 * 
 * Zoom linki, ders başlığı ve manuel ders override gibi hassas verileri
 * Supabase'deki settings tablosundan yönetir.
 */
import { useState, useEffect } from 'react';
import { getSystemConfig, saveSystemConfig, clearSystemConfigCache, getManualLessonActive, setManualLessonActive } from '../../services/systemSettingsService';
import { subscribeToSettingStore } from '../../services/dbFirebase';

export const SystemConfigManager = () => {
  const [zoomLink, setZoomLink] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Manuel ders override
  const [manualLessonActive, setManualLessonActiveState] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    getSystemConfig().then(cfg => {
      setZoomLink(cfg.zoomLink || '');
      setLessonTitle(cfg.lessonTitle || '');
      setManualLessonActiveState(cfg.manual_lesson_active === true);
      setLoading(false);
    });

    // Gerçek zamanlı override takibi
    const unsub = subscribeToSettingStore<Record<string, unknown> | null>('system_config', null, (data) => {
      setManualLessonActiveState(data?.manual_lesson_active === true);
    });
    return () => unsub();
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

  const handleToggleOverride = async () => {
    setOverrideLoading(true);
    try {
      const newVal = !manualLessonActive;
      await setManualLessonActive(newVal);
      setManualLessonActiveState(newVal);
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Manuel Ders Override ── */}
      <div className={`border p-6 rounded-xl transition-all duration-300 ${
        manualLessonActive
          ? 'bg-[#39FF14]/5 border-[#39FF14]/40 shadow-[0_0_30px_rgba(57,255,20,0.15)]'
          : 'bg-[#0A1128]/80 border-[#FF4500]/20'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-1 uppercase tracking-widest flex items-center gap-2 ${manualLessonActive ? 'text-[#39FF14]' : 'text-[#FF4500]'}`}>
              <span className="text-xl">{manualLessonActive ? '🟢' : '🔴'}</span>
              Dersi Şimdi Başlat (Manuel Override)
            </h3>
            <p className="text-gray-400 text-sm">
              {manualLessonActive
                ? 'Ders şu anda manuel olarak aktif — saat kaç olursa olsun tüm ajanlar Zoom\'a yönlendiriliyor.'
                : 'Bu toggle aktifleştirildiğinde ders saatine bakılmaksızın ajanlar otomatik Zoom\'a yönlendirilir.'}
            </p>
          </div>
          <button
            onClick={handleToggleOverride}
            disabled={overrideLoading}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 shrink-0 border-2 disabled:opacity-70 ${
              manualLessonActive
                ? 'bg-[#39FF14] border-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.5)]'
                : 'bg-gray-800 border-gray-600 hover:border-gray-400'
            }`}
            title={manualLessonActive ? 'Dersi Durdur' : 'Dersi Başlat'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                manualLessonActive ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {manualLessonActive && (
          <div className="mt-4 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="inline-block w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
            <span className="text-[#39FF14] text-sm font-mono font-bold tracking-wider">
              MANUEL DERS AKTİF — AJANLAR YÖNLENDİRİLİYOR
            </span>
          </div>
        )}
      </div>

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
