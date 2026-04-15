import { useState, useEffect } from 'react';
import { getSettingStore, saveSettingStore } from '../../services/dbFirebase';

export interface SurveyQuestion {
  text: string;
  options: string[];
}

export interface SurveyEntry {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  createdAt: number;
}

// ────────────────────────────────────────────────────────────────
// Yardımcı: Tek soru düzenleyici
// ────────────────────────────────────────────────────────────────
const QuestionEditor = ({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: SurveyQuestion;
  index: number;
  onChange: (q: SurveyQuestion) => void;
  onRemove: () => void;
}) => {
  const updateOption = (i: number, val: string) => {
    const opts = [...question.options];
    opts[i] = val;
    onChange({ ...question, options: opts });
  };

  const addOption = () => onChange({ ...question, options: [...question.options, ''] });
  const removeOption = (i: number) => {
    if (question.options.length <= 2) return; // en az 2 seçenek
    onChange({ ...question, options: question.options.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="bg-[#060d1f] border border-[#8a2be2]/30 rounded-xl p-4 space-y-3 relative">
      {/* Soru başlığı */}
      <div className="flex items-start gap-2">
        <span className="text-[#8a2be2] font-black text-lg mt-1 shrink-0">{index + 1}.</span>
        <input
          type="text"
          placeholder={`Soru ${index + 1}`}
          value={question.text}
          onChange={e => onChange({ ...question, text: e.target.value })}
          className="flex-1 bg-transparent border-b border-gray-700 focus:border-[#8a2be2] text-white py-1 px-0 focus:outline-none text-sm transition-colors"
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-[#FF4500] hover:text-white transition-colors text-xs font-bold uppercase shrink-0 mt-1"
        >
          ✕ Sil
        </button>
      </div>

      {/* Seçenekler */}
      <div className="pl-6 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Seçenekler</p>
        {question.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[#8a2be2] text-xs shrink-0">{String.fromCharCode(65 + i)}.</span>
            <input
              type="text"
              placeholder={`Seçenek ${String.fromCharCode(65 + i)}`}
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              className="flex-1 bg-transparent border-b border-gray-800 focus:border-[#8a2be2] text-gray-200 py-0.5 px-0 focus:outline-none text-sm transition-colors"
            />
            {question.options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-gray-600 hover:text-[#FF4500] transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-[#8a2be2] hover:text-[#cda7f3] text-xs font-bold uppercase tracking-wider mt-1 transition-colors"
        >
          + Seçenek Ekle
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Ana Bileşen
// ────────────────────────────────────────────────────────────────
export const SurveyManager = () => {
  const [surveys, setSurveys] = useState<SurveyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { text: '', options: ['', ''] },
  ]);
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

  const addQuestion = () =>
    setQuestions([...questions, { text: '', options: ['', ''] }]);

  const updateQuestion = (i: number, q: SurveyQuestion) => {
    const updated = [...questions];
    updated[i] = q;
    setQuestions(updated);
  };

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Doğrulama
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Soru ${i + 1} boş bırakılamaz.`);
        return;
      }
      if (q.options.some(o => !o.trim())) {
        alert(`Soru ${i + 1}: tüm seçenekler doldurulmalıdır.`);
        return;
      }
    }

    setSaving(true);

    const newEntry: SurveyEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      questions,
      isActive: true,
      createdAt: Date.now(),
    };

    const newArr = [newEntry, ...surveys];
    await saveSettingStore('surveys', newArr);
    setSurveys(newArr);

    // Formu sıfırla
    setTitle('');
    setDescription('');
    setQuestions([{ text: '', options: ['', ''] }]);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu anketi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    const newArr = surveys.filter(s => s.id !== id);
    await saveSettingStore('surveys', newArr);
    setSurveys(newArr);
  };

  const toggleActive = async (id: string) => {
    const newArr = surveys.map(s => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    await saveSettingStore('surveys', newArr);
    setSurveys(newArr);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── FORM OLUŞTURUCU ── */}
      <div className="bg-[#0A1128]/80 border border-[#8a2be2]/30 p-6 clip-path-diagonal">
        <h3 className="text-[#8a2be2] text-lg font-bold mb-5 uppercase tracking-widest flex items-center gap-2">
          <span className="text-xl">📋</span> Yeni Sorgu / Anket Oluştur
        </h3>

        <form onSubmit={handleAdd} className="space-y-5 max-w-2xl">
          {/* Başlık */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Sorgu Başlığı *</label>
            <input
              type="text"
              placeholder="Örn: Ders Hakkında Görüşler"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#8a2be2] rounded-lg transition-colors"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Kısa Açıklama</label>
            <textarea
              placeholder="Bu sorgunun amacı..."
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-[#050505] border border-gray-700 text-white p-3 w-full focus:outline-none focus:border-[#8a2be2] rounded-lg transition-colors resize-none"
            />
          </div>

          {/* Sorular */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 block">Sorular *</label>
            {questions.map((q, i) => (
              <QuestionEditor
                key={i}
                index={i}
                question={q}
                onChange={updated => updateQuestion(i, updated)}
                onRemove={() => removeQuestion(i)}
              />
            ))}
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 text-[#8a2be2] hover:text-[#cda7f3] font-bold text-sm uppercase tracking-wider transition-colors"
            >
              <span className="text-xl leading-none">+</span> Soru Ekle
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-[#8a2be2]/20 hover:bg-[#8a2be2] text-[#cda7f3] hover:text-white border border-[#8a2be2] px-8 py-3 font-bold transition-all uppercase tracking-widest rounded-lg disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : '🚀 Yayınla'}
          </button>
        </form>
      </div>

      {/* ── LİSTE ── */}
      <div className="bg-[#0A1128]/60 border border-gray-800 p-4 rounded-xl">
        <h3 className="text-gray-400 text-sm font-mono tracking-widest mb-4">
          AKTİF ve GEÇMİŞ SORGULAR ({surveys.length})
        </h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">Yükleniyor...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-6 text-gray-600">Henüz hiçbir sorgu veya anket eklenmedi.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {surveys.map(s => (
              <div
                key={s.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  !s.isActive ? 'opacity-50 blur-[1px] hover:blur-none hover:opacity-100' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-bold text-white">{s.title}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase font-black tracking-wider rounded ${
                        s.isActive ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'bg-[#FF4500]/10 text-[#FF4500]'
                      }`}
                    >
                      {s.isActive ? 'YAYINDA' : 'PASİF'}
                    </span>
                  </div>
                  {s.description && <p className="text-gray-400 text-sm mb-1">{s.description}</p>}
                  <p className="text-[#8a2be2] text-xs font-mono">{s.questions?.length || 0} Soru</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(s.id)}
                    className="px-4 py-2 border border-gray-600 hover:border-white text-xs font-bold transition-all uppercase rounded"
                  >
                    {s.isActive ? 'Durdur' : 'Yayınla'}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-4 py-2 bg-[#FF4500]/10 border border-[#FF4500]/30 text-[#FF4500] hover:bg-[#FF4500] hover:text-black text-xs font-bold transition-all uppercase rounded"
                  >
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
