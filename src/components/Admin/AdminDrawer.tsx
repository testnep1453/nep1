import { useState } from 'react';

export const AdminDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggler Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-[#6358cc] to-[#8b7fd8] text-white p-3 md:p-4 rounded-full shadow-[0_0_20px_rgba(99,88,204,0.6)] hover:scale-110 active:scale-95 transition-all z-40 border-2 border-white/20 flex translate-y-0 hover:-translate-y-1"
      >
        <span className="text-2xl md:text-3xl">👑</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Pane */}
      <div 
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-gradient-to-b from-[#1a1d2e] to-[#25293c] border-l-2 border-[#ff9f43]/40 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-[101] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 border-b-2 border-white/10 flex justify-between items-center bg-[#2d3142]/50">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(255,159,67,0.5)]">
            <span className="text-2xl text-[#ff9f43]">👑</span> KOMUTA MERKEZİ
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="bg-[#1a1d2e]/80 p-5 rounded-2xl border-2 border-[#00cfe8]/20 hover:border-[#00cfe8]/50 transition-colors group">
            <h3 className="text-[#00cfe8] font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="text-lg">📡</span> Bildirim Gönder
            </h3>
            <p className="text-white/60 text-xs font-medium mb-4">Ajanlara operasyon güncellemeleri ve motive edici mesajlar yolla.</p>
            <textarea 
              className="w-full bg-[#25293c] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#00cfe8] resize-none mb-3" 
              placeholder="Mesajınızı girin..."
              rows={3}
            />
            <button className="w-full bg-[#00cfe8]/20 hover:bg-[#00cfe8]/40 text-[#00cfe8] font-bold py-2 rounded-xl transition-colors border border-[#00cfe8]/30">
              SİSTEME GÖNDER
            </button>
          </div>

          <div className="bg-[#1a1d2e]/80 p-5 rounded-2xl border-2 border-[#ff9f43]/20 hover:border-[#ff9f43]/50 transition-colors group">
            <h3 className="text-[#ff9f43] font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="text-lg">👥</span> Ajan Yönetimi
            </h3>
            <p className="text-white/60 text-xs font-medium mb-4">Sisteme yeni ajanlar kaydet, mevcut olanların XP ve Level durumlarını güncelle.</p>
            <div className="space-y-2">
              <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-xl transition-colors border border-white/10 text-sm">
                + YENİ AJAN EKLE
              </button>
              <button className="w-full bg-[#d44d4e]/10 hover:bg-[#d44d4e]/30 text-[#ff6b6e] font-bold py-2 rounded-xl transition-colors border border-[#d44d4e]/30 text-sm">
                AJAN LİSTESİ / DÜZENLE
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-black/20 rounded-xl text-center">
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
              NOT: Veritabanı (Backend) işlemleri çok yakında aktif edilecek.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
