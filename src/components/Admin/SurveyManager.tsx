import { useState, useEffect } from 'react';
import { getSettingStore, saveSettingStore } from '../../services/dbFirebase';

export interface SurveyEntry {
  id: string;
  title: string;
  description: string;
  questions: { text: string; options: string[] }[];
  isActive: boolean;
  createdAt: number;
}

export const SurveyManager = () => {
  const [surveys, setSurveys] = useState<SurveyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questionsJson, setQuestionsJson] = useState('[\n  {\n    "text": "Örnek Soru 1?",\n    "options": ["Seçenek A", "Seçenek B"]\n  }\n]');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    const data = await getSettingStore<SurveyEntry[]>('surveys', []);
    setSurveys(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(questionsJson);
      if (!Array.isArray(parsedQuestions)) throw new Error('Dizi olmalı');
    } catch {
      alert('Soru seti geçerli bir JSON dizisi deðil!');
      return;
    }

    setSaving(true);
    
    const newEntry: SurveyEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      questions: parsedQuestions,
      isActive: true,
      createdAt: Date.now(),
    };
    
    const newArr = [newEntry, ...surveys];
    await saveSettingStore('surveys', newArr);
    setSurveys(newArr);
    setTitle('');
    setDescription('');
    setQuestionsJson('[\n  {\n    "text": "Yeni Soru?",\n    "options": ["Evet", "Hayır"]\n  }\n]');
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu anketi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    const newArr = surveys.filter(s => s.id !== id);
    await saveSettingStore('surveys', newArr);
    setSurveys(newArr);
  };

  const toggleActive = async (id: string) => {
    const newArr = surveys.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    await saveSettingStore('surveys', newArr);
    setSurveys(newArr);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#0A1128]/80 border border-[#8a2be2]/30 p-6 clip-path-diagonal">
        <h3 className="text-[#8a2be2] text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
          <span className="text-xl">📋</span> Yeni Analiz / Anket Ekle (Sorgu Odası)
        </h3>
        <form onSubmit={handleAdd} className="space-y-4 max-w-xl">
          <input
            type="text" placeholder="Sorgu Başlığı" required
            value={title} onChange={e => setTitle(e.target.value)}
            className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#8a2be2] font-mono transition-colors"
          />
          <textarea
            placeholder="Kısa Açıklama" rows={2}
            value={description} onChange={e => setDescription(e.target.value)}
            className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#8a2be2] font-mono transition-colors resize-none"
          />
          <textarea
            placeholder='Soru Seti JSON Formatında' rows={5} required
            value={questionsJson} onChange={e => setQuestionsJson(e.target.value)}
            className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#8a2be2] font-mono transition-colors resize-none text-xs"
          />
          <button type="submit" disabled={saving} className="bg-[#8a2be2]/20 hover:bg-[#8a2be2] text-[#cda7f3] hover:text-black border border-[#8a2be2] px-6 py-3 font-bold transition-all uppercase tracking-widest rounded disabled:opacity-50">
            {saving ? 'Ekleniyor...' : 'Kayıt Ekle'}
          </button>
        </form>
      </div>

      <div className="bg-[#0A1128]/60 border border-gray-800 p-4">
        <h3 className="text-gray-400 text-sm font-mono tracking-widest mb-4">AKTİF ve GEÇMİŞ SORGULAR ({surveys.length})</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">Yükleniyor...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-6 text-gray-600">Henüz hiçbir sorgu veya anket eklenmedi.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {surveys.map(s => (
              <div key={s.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${!s.isActive ? 'opacity-50 blur-[1px] hover:blur-none hover:opacity-100' : 'hover:bg-white/5'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-bold text-white">{s.title}</span>
                    <span className={`px-2 py-0.5 text-[10px] uppercase font-black tracking-wider rounded ${s.isActive ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'bg-[#FF4500]/10 text-[#FF4500]'}`}>
                      {s.isActive ? 'YAYINDA' : 'PASİF'}
                    </span>
                  </div>
                  {s.description && <p className="text-gray-400 text-sm mb-1">{s.description}</p>}
                  <p className="text-[#8a2be2] text-xs font-mono">{s.questions?.length || 0} Soru</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleActive(s.id)} className="px-4 py-2 border border-gray-600 hover:border-white text-xs font-bold transition-all uppercase rounded">
                    {s.isActive ? 'Durdur' : 'Yayınla'}
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="px-4 py-2 bg-[#FF4500]/10 border border-[#FF4500]/30 text-[#FF4500] hover:bg-[#FF4500] hover:text-black text-xs font-bold transition-all uppercase rounded">
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
