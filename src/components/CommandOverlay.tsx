import React, { useEffect, useState } from 'react';
import { YouTubePlayer } from './VideoTheater/YouTubePlayer';
import { X, Maximize, Target } from 'lucide-react';

interface TrailerOverlayProps {
  videoId: string;
  onClose?: () => void;
  isResettable?: boolean;
}

export const TrailerOverlay = ({ videoId, onClose, isResettable = false }: TrailerOverlayProps) => {
  const [fullscreenRequested, setFullscreenRequested] = useState(false);

  useEffect(() => {
    // Attempt full screen when mounted
    const element = document.documentElement;
    if (element.requestFullscreen && !document.fullscreenElement) {
       element.requestFullscreen().catch(err => {
         console.warn("Fullscreen request failed:", err);
       });
    }
    
    // Disable scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
      </div>

      <div className="w-full h-full relative z-10 flex flex-col">
        {/* Header - Security Overrides */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#39FF14]/10 border border-[#39FF14]/40 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                <Target className="text-[#39FF14] animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-[#39FF14] font-black text-xs sm:text-sm tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">
                  KOMUTA MERKEZİ: FRAGMAN YAYINDA
                </h3>
                <p className="text-white/40 text-[10px] sm:text-xs font-mono tracking-tighter">PROTO_ALPHA_STREAM_FORCED</p>
              </div>
           </div>
           
           {isResettable && onClose && (
             <button 
               onClick={onClose}
               className="pointer-events-auto w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#FF4500] hover:bg-[#FF4500]/10 transition-all shadow-lg"
             >
               <X size={20} />
             </button>
           )}
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl aspect-video bg-black shadow-[0_0_100px_rgba(57,255,20,0.1)] border-4 border-[#39FF14]/10 rounded-2xl overflow-hidden relative">
             {/* Scanning lines */}
             <div className="absolute inset-0 pointer-events-none z-20 opacity-30 scanlines" />
             <YouTubePlayer videoId={videoId} />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent text-center">
           <p className="text-white/30 text-[10px] font-mono animate-pulse uppercase tracking-[0.2em]">
             İPTAL EDİLEMEZ SİSTEM OVERRIDE AKTİF • HERKES BU FRAGMANI İZLİYOR
           </p>
        </div>
      </div>
    </div>
  );
};



