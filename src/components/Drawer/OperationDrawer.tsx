/**
 * Operasyon Çekmecesi (Drawer)
 * 3'ü 1 arada: Geri Sayım → Fragman → Zoom Yönlendirme
 * Sol taraftan açılır, hem öğrenci hem admin için
 */

import { useState, useEffect, useCallback } from 'react';
import { Lesson, Trailer } from '../../types/student';
import { CircularCountdown } from '../Countdown/CircularCountdown';
import { YouTubePlayer } from '../VideoTheater/YouTubePlayer';
// useCountdown is used inside CircularCountdown
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
}: OperationDrawerProps) => {
  const [activeSection, setActiveSection] = useState<'guncel' | 'arsiv'>('guncel');
  const [currentView, setCurrentView] = useState<'countdown' | 'trailer' | 'lesson_active' | 'lesson_ended'>('countdown');

  // Fragman zamanı kontrol
  const isTrailerTime = useCallback((t: Trailer | null): boolean => {
    if (!t || !t.isActive || !t.youtubeId || !t.showDate || !t.showTime) return false;
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    return t.showDate === current && currentTime >= t.showTime;
  }, []);

  // Otomatik görünüm geçişi
  useEffect(() => {
    const checkStatus = () => {
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

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[90vw] max-w-md bg-gradient-to-b from-[#0A1128] to-[#050505] border-r border-[#6358cc]/30 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-[101] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#6358cc]/20 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="text-xl">⚡</span> OPERASYON MERKEZİ
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sekmeler */}
        <div className="flex border-b border-[#6358cc]/20 shrink-0">
          <button
            onClick={() => setActiveSection('guncel')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all min-h-[48px] ${
              activeSection === 'guncel'
                ? 'text-[#00F0FF] border-b-2 border-[#00F0FF] bg-[#00F0FF]/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Güncel Operasyon
          </button>
          <button
            onClick={() => setActiveSection('arsiv')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all min-h-[48px] ${
              activeSection === 'arsiv'
                ? 'text-[#FF9F43] border-b-2 border-[#FF9F43] bg-[#FF9F43]/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Arşiv
          </button>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeSection === 'guncel' && (
            <div className="space-y-6">
              {/* Geri Sayım */}
              {currentView === 'countdown' && lesson && (
                <div className="animate-fade-in">
                  <div className="text-center mb-4">
                    <span className="text-xs text-[#00F0FF] font-mono tracking-widest">⏰ SONRAKİ DERSE</span>
                  </div>
                  <CircularCountdown
                    targetTime={lesson.startTime}
                    onComplete={() => {}}
                  />
                </div>
              )}

              {/* Fragman Oynatma */}
              {currentView === 'trailer' && trailer && trailer.youtubeId && (
                <div className="animate-fade-in">
                  <div className="text-center mb-4">
                    <span className="text-xs text-[#F5D32E] font-mono tracking-widest animate-pulse">
                      🎬 FRAGMAN YAYINDA
                    </span>
                  </div>
                  <YouTubePlayer videoId={trailer.youtubeId} />
                </div>
              )}

              {/* Ders Aktif */}
              {currentView === 'lesson_active' && (
                <div className="animate-fade-in text-center space-y-4">
                  <div className="text-6xl animate-pulse">🟢</div>
                  <h3 className="text-xl font-bold text-[#39FF14] uppercase tracking-wider">
                    DERS AKTİF
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Zoom'a otomatik yönlendirme yapıldı.
                  </p>
                  <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg p-4">
                    <p className="text-[#39FF14] text-xs font-mono">
                      DURUM: OPERASYONDA
                    </p>
                  </div>
                </div>
              )}

              {/* Ders Bitti */}
              {currentView === 'lesson_ended' && (
                <div className="animate-fade-in text-center space-y-4">
                  <div className="text-4xl">✅</div>
                  <h3 className="text-lg font-bold text-gray-400 uppercase tracking-wider">
                    DERS TAMAMLANDI
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Sonraki ders için geri sayım başladı.
                  </p>
                  {/* Sonraki ders geri sayımı */}
                  {(() => {
                    const nextLesson = getNextLesson();
                    return (
                      <div className="mt-4">
                        <CircularCountdown
                          targetTime={nextLesson.startTime}
                          onComplete={() => {}}
                        />
                        <p className="text-white/40 text-xs mt-2">{nextLesson.title}</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {activeSection === 'arsiv' && (
            <div className="space-y-4">
              <p className="text-gray-500 text-sm text-center py-8">
                Geçmiş ders kayıtları burada listelenecek.
              </p>
            </div>
          )}
        </div>

        {/* Footer Durum Göstergesi */}
        <div className="p-4 border-t border-[#6358cc]/20 bg-[#050505]/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                currentView === 'lesson_active' ? 'bg-[#39FF14] animate-pulse' :
                currentView === 'trailer' ? 'bg-[#F5D32E] animate-pulse' :
                'bg-gray-600'
              }`} />
              <span className="text-gray-500 text-xs font-mono">
                {currentView === 'lesson_active' ? 'DERS AKTİF' :
                 currentView === 'trailer' ? 'FRAGMAN' :
                 currentView === 'lesson_ended' ? 'DERS BİTTİ' :
                 'BEKLEME'}
              </span>
            </div>
            <span className="text-gray-600 text-xs font-mono">
              {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
