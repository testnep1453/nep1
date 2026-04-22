import { useState, useEffect } from 'react';
import { getSettingStore, saveSettingStore } from '../../services/supabaseService';

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
}

export const KnowledgeManager = () => {
  const [items, setItems] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Genel Bilgi');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await getSettingStore<KnowledgeEntry[]>('knowledge_base', []);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    
    const newEntry: KnowledgeEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      createdAt: Date.now(),
    };
    
    const newArr = [newEntry, ...items];
    await saveSettingStore('knowledge_base', newArr);
    setItems(newArr);
    setTitle('');
    setContent('');
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu bilgiyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    const newArr = items.filter(s => s.id !== id);
    await saveSettingStore('knowledge_base', newArr);
    setItems(newArr);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-6 clip-path-diagonal">
        <h3 className="text-[#00F0FF] text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
          <span className="text-xl">📚</span> Bilgi Odası Kılavuz Ekle
        </h3>
        <form onSubmit={handleAdd} className="space-y-4 max-w-xl">
          <div className="flex gap-4">
            <input
              id="knowledge-title"
              name="knowledge-title"
              type="text" placeholder="Başlık" required
              aria-label="Kılavuz başlığı"
              value={title} onChange={e => setTitle(e.target.value)}
              className="bg-[#050505] border border-gray-700 text-white p-3 flex-1 focus:outline-none focus:border-[#00F0FF] font-mono transition-colors"
            />
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="bg-[#050505] border border-gray-700 text-white p-3 w-40 focus:outline-none focus:border-[#00F0FF] font-mono transition-colors"
            >
              <option value="Genel Bilgi">Genel Bilgi</option>
              <option value="Kurallar">Kurallar</option>
              <option value="Taktikler">Taktikler</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>
          <textarea
            id="knowledge-content"
            name="knowledge-content"
            aria-label="Kılavuz metni"
            placeholder="Kılavuz veya bilgi metni..." rows={6} required
            value={content} onChange={e => setContent(e.target.value)}
            className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#00F0FF] font-mono transition-colors resize-y min-h-[120px]"
          />
          <button type="submit" disabled={saving} className="bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF] px-6 py-3 font-bold transition-all uppercase tracking-widest rounded disabled:opacity-50">
            {saving ? 'Ekleniyor...' : 'Kılavuz Ekle'}
          </button>
        </form>
      </div>

      <div className="bg-[#0A1128]/60 border border-gray-800 p-4">
        <h3 className="text-gray-400 text-sm font-mono tracking-widest mb-4">SİSTEMDEKİ BİLGİ KAYITLARI ({items.length})</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-gray-600">Henüz hiçbir kılavuz eklenmedi.</div>
        ) : (
          <div className="space-y-4">
            {items.map(entry => (
              <div key={entry.id} className="p-5 border border-gray-800 bg-[#0A1128] hover:border-gray-600 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 border-b border-gray-800 pb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white">{entry.title}</h4>
                    <span className="text-xs bg-[#00F0FF]/15 text-[#00F0FF] px-2 py-0.5 uppercase tracking-widest border border-[#00F0FF]/30 mt-1 inline-block">
                      KATEGORİ: {entry.category}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(entry.id)} className="px-4 py-2 shrink-0 bg-[#FF4500]/10 border border-[#FF4500]/30 text-[#FF4500] hover:bg-[#FF4500] hover:text-black text-xs font-bold transition-all uppercase rounded">
                    BİLGİYİ SİL
                  </button>
                </div>
                <div className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                  {entry.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



