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
      {/* ── DEVASA MANUEL DERS BAŞLATMA BUTONU ── */}
      <button
        onClick={handleToggleOverride}
        disabled={overrideLoading}
        className={`w-full py-10 px-6 rounded-2xl font-black text-2xl md:text-4xl uppercase tracking-widest transition-all duration-300 flex flex-col items-center justify-center gap-4 border-4 shadow-2xl relative overflow-hidden disabled:opacity-50 ${
          manualLessonActive
            ? 'bg-[#39FF14] border-white text-black shadow-[0_0_80px_rgba(57,255,20,0.8)] scale-[1.02]'
            : 'bg-[#FF4500] border-black text-white shadow-[0_0_40px_rgba(255,69,0,0.6)] hover:bg-[#ff5511]'
        }`}
      >
        <div className="flex items-center gap-4 z-10 text-center flex-wrap justify-center">
          <span className="text-5xl md:text-6xl drop-shadow-lg">🚀</span>
          <span className="drop-shadow-sm">DERSİ ŞİMDİ BAŞLAT (ZORUNLU GEÇİŞ)</span>
        </div>
        
        <span className={`text-base md:text-lg font-bold px-8 py-2 rounded-full z-10 shadow-inner mt-2 ${
          manualLessonActive 
            ? 'bg-black text-[#39FF14] border-2 border-black' 
            : 'bg-black/40 text-white border-2 border-white'
        }`}>
          {overrideLoading 
            ? 'İŞLENİYOR...' 
            : manualLessonActive 
              ? 'DURUM: AÇIK — KAPATMAK İÇİN TIKLAYIN' 
              : 'DURUM: KAPALI — AÇMAK İÇİN TIKLAYIN'}
        </span>

        {manualLessonActive && (
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse pointer-events-none" />
        )}
      </button>

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
