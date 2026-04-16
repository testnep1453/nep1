import { useState } from 'react';

interface JoinClassButtonProps {
  zoomLink: string;
  studentName: string;
}

export const JoinClassButton = ({ zoomLink, studentName }: JoinClassButtonProps) => {
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const handleJoinClass = () => {
    setShowTerminal(true);

    const lines = [
      '> Sunucuya bağlanılıyor...',
      '> Güvenlik protokolleri doğrulanıyor...',
      '> Oyuncu profili (XP, Envanter) yükleniyor...',
      '> NEP Ana Sunucusuna bağlantı kuruldu. Işınlanıyorsunuz!'
    ];

    lines.forEach((line, index) => {
      setTimeout(() => {
        setTerminalLines((prev) => [...prev, line]);
      }, index * 800);
    });

    setTimeout(() => {
      let finalUrl: URL | null = null;
      try {
        if (zoomLink && zoomLink.trim() !== '') {
          // Protocol kontrolü ve düzeltme
          const linkToTest = zoomLink.includes('://') ? zoomLink : `https://${zoomLink}`;
          finalUrl = new URL(linkToTest);
        }
      } catch (e) {
        finalUrl = null;
      }

      if (finalUrl && (finalUrl.protocol === 'http:' || finalUrl.protocol === 'https:')) {
        try {
          const encodedName = btoa(unescape(encodeURIComponent(studentName)));
          finalUrl.searchParams.set('un', encodedName);
          
          console.log("Zoom'a manuel yönlendiriliyor:", finalUrl.toString());
          window.location.href = finalUrl.toString();
        } catch (err) {
          console.error("Link oluşturma hatası:", err);
          setTerminalLines(prev => [...prev, '> HATA: LİNK OLUŞTURULAMADI', '> Teknik bir sorun oluştu.']);
        }
      } else {
        setTerminalLines(prev => [...prev, '> KRİTİK HATA: GEÇERSİZ BAĞLANTI PROTOKOLÜ', '> Lütfen admin üzerinden Zoom linkini güncelleyin.']);
        console.warn("Zoom linki geçersiz veya eksik:", zoomLink);
      }
    }, 3200);
  };

  if (showTerminal) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-[#1a1d2e] rounded-2xl p-8 border-2 border-[#00cfe8] shadow-2xl shadow-[#00cfe8]/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#d44d4e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ff9f43]"></div>
              <div className="w-3 h-3 rounded-full bg-[#2b9956]"></div>
            </div>
            <span className="text-[#00cfe8] text-sm font-mono">TERMINAL</span>
          </div>
          <div className="space-y-3">
            {terminalLines.map((line, index) => (
              <div
                key={index}
                className="text-[#00cfe8] font-mono text-sm md:text-base animate-terminal-line flex items-center gap-2"
              >
                <span className="text-[#2b9956]">$</span>
                {line}
              </div>
            ))}
            {terminalLines.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[#2b9956] font-mono">$</span>
                <div className="w-2 h-4 bg-[#00cfe8] animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-pulse-glow">
      <button
        onClick={handleJoinClass}
        className="w-full bg-gradient-to-r from-[#2b9956] via-[#3dd56d] to-[#2b9956] text-white font-bold py-8 px-8 rounded-2xl uppercase tracking-wider text-2xl md:text-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#2b9956]/50 border-4 border-[#3dd56d] animate-glow-pulse"
      >
        🚀 DERSE KATIL
      </button>
    </div>
  );
};



