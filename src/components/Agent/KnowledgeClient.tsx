import { useState, useEffect } from 'react';
import { getSettingStore } from '../../services/supabaseService';
import type { KnowledgeEntry } from '../Admin/KnowledgeManager';

export const KnowledgeClient = () => {
  const [items, setItems] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<KnowledgeEntry | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await getSettingStore<KnowledgeEntry[]>('knowledge_base', []);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
      
      {selectedItem ? (
        <div className="bg-[#0A1128]/90 border border-[#00F0FF]/40 rounded-xl p-6 lg:p-10 shadow-2xl animate-fade-in relative h-full flex flex-col">
          <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-gray-400 hover:text-[#FF4500] bg-black/40 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
            ✕
          </button>
          
          <div className="mb-6 border-b border-[#00F0FF]/20 pb-4">
            <span className="text-[#00F0FF] text-xs font-black tracking-widest uppercase bg-[#00F0FF]/10 px-3 py-1 rounded inline-block mb-3">
              {selectedItem.category}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{selectedItem.title}</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {selectedItem.content}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#0A1128] to-[#050505] border-t-2 border-[#00F0FF]/30 p-6 rounded-2xl relative overflow-hidden shadow-2xl h-full flex flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between mb-8">
            <h3 className="text-white font-black text-xl tracking-[4px] uppercase flex items-center gap-3">
              <span className="text-[#00F0FF] text-2xl">📚</span>
              Bilgi Odası
            </h3>
          </div>
          
          {loading ? (
            <div className="text-center py-10 text-[#00F0FF] animate-pulse relative z-10">Veritabanı Taranıyor...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 relative z-10">
              <span className="text-4xl opacity-50 mb-4 block">🗂️</span>
              <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">Şu an kayıtlı bir bilgi bulunmuyor.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 flex flex-col gap-3">
              {items.map(item => (
                <button key={item.id} onClick={() => setSelectedItem(item)} className="w-full bg-[#050505]/60 hover:bg-[#00F0FF]/10 border border-[#00F0FF]/20 hover:border-[#00F0FF]/50 p-4 rounded-lg flex items-center justify-between text-left transition-all group">
                  <div className="flex flex-col">
                    <span className="text-white font-bold mb-1 group-hover:text-[#00F0FF] transition-colors">{item.title}</span>
                    <span className="text-xs text-gray-500 font-mono">Kategori: {item.category}</span>
                  </div>
                  <span className="text-[#00F0FF] opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all">❯</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};



