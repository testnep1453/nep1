/**
 * Operasyon Çekmecesi — Tam Ekran
 */

import { useState, useEffect, useCallback } from 'react';
import { Lesson, Trailer } from '../../types/student';
import { CircularCountdown } from '../Countdown/CircularCountdown';
import { YouTubePlayer } from '../VideoTheater/YouTubePlayer';
import { isLessonActive, isLessonEnded, getNextLesson, FIXED_LESSON_SCHEDULE } from '../../config/lessonSchedule';
import { subscribeToSettingStore } from '../../services/supabaseService';
import { getSystemConfig, setManualLessonActive } from '../../services/systemSettingsService';

interface OperationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  trailer: Trailer | null;
  isAdmin: boolean;
  studentName: string;
  zoomLink: string;
}

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatLessonDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_TR[m - 1]} ${y}`;
}

function getLessonInfo(lesson: Lesson | null): { lessonNo: number | null; formattedDate: string } {
  if (!lesson) return { lessonNo: null, formattedDate: '' };
  const found = FIXED_LESSON_SCHEDULE.find(l => l.date === lesson.date);
  return {
    lessonNo: found ? found.lessonNo : null,
    formattedDate: formatLessonDate(lesson.date),
  };
}

export const OperationDrawer = ({
  isOpen,
  onClose,
  lesson,
  trailer,
  isAdmin,
}: OperationDrawerProps) => {
  const [currentView, setCurrentView] = useState<
    'countdown' | 'trailer' | 'lesson_active' | 'lesson_ended'
  >('countdown');
  const [now, setNow] = useState(new Date());
  
  // Manuel override states for Admin
  const [manualLessonActive, setManualLessonActiveState] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    getSystemConfig().then(cfg => {
      setManualLessonActiveState(cfg.manual_lesson_active === true);
    });

    const unsub = subscribeToSettingStore<Record<string, unknown> | null>('system_config', null, (data) => {
      if (data) setManualLessonActiveState(data.manual_lesson_active === true);
    });
    return () => unsub();
  }, [isAdmin]);

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

  const isTrailerTime = useCallback((t: Trailer | null): boolean => {
    if (!t || !t.isActive || !t.youtubeId || !t.showDate || !t.showTime) return false;
    const d = new Date();
    const current = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return t.showDate === current && `${hh}:${mm}` >= t.showTime;
  }, []);

  useEffect(() => {
    const check = () => {
      setNow(new Date());
      if (isLessonActive()) setCurrentView('lesson_active');
      else if (isLessonEnded()) setCurrentView('lesson_ended');
      else if (isTrailerTime(trailer)) setCurrentView('trailer');
      else setCurrentView('countdown');
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [trailer, isTrailerTime]);

  if (!isOpen) return null;

  const { lessonNo, formattedDate } = getLessonInfo(lesson);
  const nextLesson = getNextLesson();
  const nextInfo = getLessonInfo(nextLesson);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overscroll-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full flex flex-col z-[101] animate-fade-in bg-gradient-to-b from-[#0A1128] via-[#080d1e] to-[#050505]"
           style={{ height: '100dvh', maxHeight: '-webkit-fill-available' }}>

        {/* Header */}
        <div className="px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span className="text-yellow-400">⚡</span>
            {isAdmin ? 'DERS YÖNETİMİ' : 'DERSE KATIL'}
          </h2>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {/* İçerik */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain touch-manipulation">
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 py-4">

            {/* ADMIN MANUAL OVERRIDE BUTTON */}
            {isAdmin && (
              <button
                onClick={handleToggleOverride}
                disabled={overrideLoading}
                className={`w-full min-h-[88px] py-6 sm:py-8 text-center px-4 sm:px-6 rounded-2xl font-black text-lg sm:text-xl md:text-2xl uppercase tracking-widest transition-all duration-300 flex flex-col items-center justify-center gap-4 border-2 shadow-2xl relative overflow-hidden disabled:opacity-50 mt-2 touch-manipulation ${
                  manualLessonActive
                    ? 'bg-[#39FF14] border-white text-black shadow-[0_0_80px_rgba(57,255,20,0.4)] scale-[1.02]'
                    : 'bg-[#FF4500] border-black text-white shadow-[0_0_40px_rgba(255,69,0,0.3)] hover:bg-[#ff5511]'
                }`}
              >
                <div className="flex items-center gap-4 z-10 text-center flex-wrap justify-center">
                  <span className="text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">🚀</span>
                  <span className="drop-shadow-sm w-full md:w-auto">DERSİ ŞİMDİ BAŞLAT<br/><span className="text-sm md:text-base opacity-80">(ZORUNLU GEÇİŞ)</span></span>
                </div>
                
                <span className={`text-xs md:text-sm font-bold px-6 py-2 rounded-full z-10 shadow-inner mt-2 ${
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
            )}

            {/* GERİ SAYIM */}
            {currentView === 'countdown' && lesson && (
              <div className="animate-fade-in flex flex-col items-center w-full gap-6">
                {/* Ders bilgisi başlık */}
                {lessonNo && (
                  <div className="text-center">
                    <div className="text-[10px] text-white/30 uppercase tracking-[4px] font-bold mb-2">
                      Sonraki Operasyon
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      Ders <span className="text-[#00F0FF]">{lessonNo}</span>
                    </div>
                    <div className="text-sm text-white/40 font-mono mt-1">
                      {formattedDate} · 19.00
                    </div>
                  </div>
                )}

                {/* Halka sayacı */}
                <CircularCountdown targetDate={lesson.startTime} />

                {/* Alt ince çizgi bilgi */}
                <div className="flex items-center gap-2 text-[11px] text-white/20 font-mono uppercase tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-[#00F0FF]/40 inline-block" />
                  Ders saatinde otomatik yönlendirileceksiniz
                </div>
              </div>
            )}

            {/* FRAGMAN */}
            {currentView === 'trailer' && trailer && trailer.youtubeId && (
              <div className="animate-fade-in text-center w-full space-y-4">
                <span className="text-xs text-[#F5D32E] font-mono tracking-widest animate-pulse">
                  🎬 FRAGMAN YAYINDA
                </span>
                <YouTubePlayer videoId={trailer.youtubeId} />
              </div>
            )}

            {/* DERS AKTİF */}
            {currentView === 'lesson_active' && (
              <div className="animate-fade-in text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-[#39FF14]/10 border-2 border-[#39FF14]/40 flex items-center justify-center mx-auto animate-pulse">
                  <span className="text-5xl">🟢</span>
                </div>
                <h3 className="text-3xl font-black text-[#39FF14] uppercase tracking-widest">
                  DERS AKTİF
                </h3>
                <p className="text-white/40 text-sm font-mono">
                  Zoom'a otomatik yönlendirme yapıldı.
                </p>
                <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-2xl px-8 py-5">
                  <p className="text-[#39FF14] text-xs font-mono tracking-[4px] uppercase">
                    DURUM: OPERASYONDA
                  </p>
                </div>
              </div>
            )}

            {/* DERS BİTTİ → Sonraki ders sayacı */}
            {currentView === 'lesson_ended' && (
              <div className="animate-fade-in flex flex-col items-center w-full gap-6">
                <div className="text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-xl font-bold text-white/50 uppercase tracking-wider">
                    Ders Tamamlandı
                  </h3>
                </div>

                <div className="w-full border-t border-white/5 pt-6 flex flex-col items-center gap-4">
                  <div className="text-center">
                    <div className="text-[10px] text-white/25 uppercase tracking-[4px] font-bold mb-1">
                      Sonraki Operasyon
                    </div>
                    {nextInfo.lessonNo && (
                      <div className="text-2xl font-black text-white">
                        Ders <span className="text-[#00F0FF]">{nextInfo.lessonNo}</span>
                        <span className="text-sm text-white/30 font-mono ml-3">{nextInfo.formattedDate}</span>
                      </div>
                    )}
                  </div>
                  <CircularCountdown targetDate={nextLesson.startTime} />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer — sadece saat */}
        <div className="px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/5 shrink-0 flex justify-end">
          <span className="text-white/20 text-xs font-mono tabular-nums">
            {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};



