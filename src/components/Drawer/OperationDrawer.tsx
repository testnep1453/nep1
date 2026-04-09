/**
 * Operasyon Çekmecesi — Tam Ekran
 * Geri Sayım → Fragman → Zoom → Tam ekran açılır
 */

import { useState, useEffect, useCallback } from 'react';
import { Lesson, Trailer } from '../../types/student';
import { CircularCountdown } from '../Countdown/CircularCountdown';
import { YouTubePlayer } from '../VideoTheater/YouTubePlayer';
import { isLessonActive, isLessonEnded, getNextLesson } from '../../config/lessonSchedule';

interface OperationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  trailer: Trailer | null;
  isAdmin: boolean;
  studentName: string;
  zoomLink: string;
}

export const OperationDrawer = ({
  isOpen,
  onClose,
  lesson,
  trailer,
  isAdmin,
}: OperationDrawerProps) => {
  const [currentView, setCurrentView] = useState<'countdown' | 'trailer' | 'lesson_active' | 'lesson_ended'>('countdown');
  const [now, setNow] = useState(new Date());

  const isTrailerTime = useCallback((t: Trailer | null): boolean => {
    if (!t || !t.isActive || !t.youtubeId || !t.showDate || !t.showTime) return false;
    const d = new Date();
    const current = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    return t.showDate === current && currentTime >= t.showTime;
  }, []);

  useEffect(() => {
    const checkStatus = () => {
      setNow(new Date());
      if (isLessonActive()) {
        setCurrentView('lesson_active');
      } else if (isLessonEnded()) {
        setCurrentView('lesson_ended');
      } else if (isTrailerTime(trailer)) {
        setCurrentView('trailer');
      } else {
        setCurrentView('countdown');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [trailer, isTrailerTime]);

  if (!isOpen) return null;

  // Sonraki ders (lesson_ended durumunda)
  const nextLesson = getNextLesson();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Tam Ekran Panel */}
      <div className="relative w-full h-full bg-gradient-to-b from-[#0A1128] to-[#050505] flex flex-col z-[101] animate-fade-in">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#6358cc]/20 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="text-xl">⚡</span>
            {isAdmin ? 'DERS YÖNETİMİ' : 'DERSE KATIL'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex items-center justify-center">
          <div className="w-full max-w-lg mx-auto">

            {/* Geri Sayım */}
            {currentView === 'countdown' && lesson && (
              <div className="animate-fade-in text-center space-y-6">
                <CircularCountdown targetDate={lesson.startTime} />
              </div>
            )}

            {/* Fragman */}
            {currentView === 'trailer' && trailer && trailer.youtubeId && (
              <div className="animate-fade-in text-center space-y-4">
                <span className="text-xs text-[#F5D32E] font-mono tracking-widest animate-pulse">
                  🎬 FRAGMAN YAYINDA
                </span>
                <YouTubePlayer videoId={trailer.youtubeId} />
              </div>
            )}

            {/* Ders Aktif */}
            {currentView === 'lesson_active' && (
              <div className="animate-fade-in text-center space-y-6">
                <div className="text-7xl animate-pulse">🟢</div>
                <h3 className="text-2xl font-bold text-[#39FF14] uppercase tracking-wider">
                  DERS AKTİF
                </h3>
                <p className="text-gray-400 text-sm">
                  Zoom'a otomatik yönlendirme yapıldı.
                </p>
                <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg p-6">
                  <p className="text-[#39FF14] text-sm font-mono">
                    DURUM: OPERASYONDA
                  </p>
                </div>
              </div>
            )}

            {/* Ders Bitti → Sonraki ders sayacı */}
            {currentView === 'lesson_ended' && (
              <div className="animate-fade-in text-center space-y-6">
                <div className="text-5xl">✅</div>
                <h3 className="text-xl font-bold text-gray-400 uppercase tracking-wider">
                  DERS TAMAMLANDI
                </h3>
                <div className="mt-4">
                  <CircularCountdown targetDate={nextLesson.startTime} />
                  <p className="text-white/40 text-xs mt-3">{nextLesson.title}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer — sadece saat */}
        <div className="p-4 border-t border-[#6358cc]/20 bg-[#050505]/80 shrink-0">
          <div className="flex items-center justify-end">
            <span className="text-gray-600 text-xs font-mono">
              {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
