import { useEffect, useState } from 'react';

interface LoginTransitionOverlayProps {
  studentName: string;
}

export const LoginTransitionOverlay = ({ studentName }: LoginTransitionOverlayProps) => {
  const [showRocket, setShowRocket] = useState(true);
  const [showEyesClosing, setShowEyesClosing] = useState(false);

  useEffect(() => {
    // 1. Roket fırlatma animasyonu (1.5sn)
    const rocketTimer = setTimeout(() => {
      setShowRocket(false);
      setShowEyesClosing(true);
    }, 1500);

    return () => {
      clearTimeout(rocketTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 min-h-screen bg-[#1a1d2e] flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* ROKET LAUNCH ANİMASYONU */}
      {showRocket && (
        <div className="text-8xl md:text-[150px] animate-rocket-launch drop-shadow-[0_0_30px_rgba(255,159,67,0.8)]">🚀</div>
      )}

      {/* GÖZ KAPAMA EFEKTİ VE YÜKLENİYOR MESAJI */}
      {showEyesClosing && (
        <div className="absolute inset-0 bg-black animate-eyes-closing flex flex-col items-center justify-center p-8">
          <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-6 uppercase tracking-widest animate-pulse">
            Işınlanıyorsunuz!
          </h2>
          <p className="text-[#00cfe8] text-center font-bold text-xl md:text-2xl drop-shadow-[0_0_10px_rgba(0,207,232,0.5)]">
            Savaş alanına gönderiliyorsun, komutan {studentName}!
          </p>
        </div>
      )}
    </div>
  );
};
