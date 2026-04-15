import { useState, useEffect } from 'react';
import { getSettingStore, saveSettingStore } from '../../services/dbFirebase';
import { supabase } from '../../config/supabase';

export type QuestionType = 'multiple_choice' | 'open_ended';

export interface SurveyQuestion {
  text: string;
  options: string[];
  type?: QuestionType;
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
  const qType = question.type || 'multiple_choice';

  const updateOption = (i: number, val: string) => {
    const opts = [...question.options];
    opts[i] = val;
    onChange({ ...question, options: opts });
  };

  const addOption = () => onChange({ ...question, options: [...question.options, ''] });
  const removeOption = (i: number) => {
    if (question.options.length <= 2) return;
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

      {/* Soru Tipi Seçici */}
      <div className="pl-6 flex gap-3">
        <button
          type="button"
          onClick={() => onChange({ ...question, type: 'multiple_choice', options: question.options.length >= 2 ? question.options : ['', ''] })}
          className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded font-bold border transition-all ${qType === 'multiple_choice' ? 'border-[#8a2be2] bg-[#8a2be2]/20 text-[#cda7f3]' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
        >
          ☑ Çoktan Seçmeli
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...question, type: 'open_ended', options: [] })}
          className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded font-bold border transition-all ${qType === 'open_ended' ? 'border-[#00F0FF] bg-[#00F0FF]/10 text-[#00F0FF]' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
        >
          ✏ Klasik / Açık Uçlu
        </button>
      </div>

      {/* Seçenekler — sadece çoktan seçmeli */}
      {qType === 'multiple_choice' && (
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
      )}

      {qType === 'open_ended' && (
        <div className="pl-6">
          <p className="text-[10px] uppercase tracking-widest text-[#00F0FF]/60 italic">
            Bu soru için öğrenciler serbest metin yazacak.
          </p>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Sonuç Görüntüleyici Modal
// ────────────────────────────────────────────────────────────────
const ResultsModal = ({ survey, onClose }: { survey: SurveyEntry; onClose: () => void }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('survey_results')
        .select('*')
        .eq('surveyId', survey.id)
        .order('createdAt', { ascending: false });
      setResults(data || []);
      setLoading(false);
    };
    load();
  }, [survey.id]);

  const getAnswerStats = (qIndex: number, question: SurveyQuestion) => {
    const qType = question.type || 'multiple_choice';
    const allAnswers = results.map(r => r.answers?.[qIndex]).filter(a => a !== undefined && a !== null && a !== '');

    if (qType === 'open_ended') {
      return { type: 'open_ended', answers: allAnswers as string[] };
    }

    // Çoktan seçmeli için sayım
    const counts: Record<string, number> = {};
    for (const opt of question.options) counts[opt] = 0;
    for (const ans of allAnswers) {
      if (typeof ans === 'string') counts[ans] = (counts[ans] || 0) + 1;
    }
    return { type: 'multiple_choice', counts, total: allAnswers.length };
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0A1128] border border-[#8a2be2]/40 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto z-[301] shadow-2xl shadow-[#8a2be2]/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest">{survey.title}</h2>
            <p className="text-[#8a2be2] text-sm font-mono mt-1">{results.length} cevap</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl font-bold">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#8a2be2] animate-pulse">Veriler yükleniyor...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Henüz hiç cevap gönderilmemiş.</div>
        ) : (
          <div className="space-y-6">
            {survey.questions.map((q, i) => {
              const stats = getAnswerStats(i, q);
              return (
                <div key={i} className="bg-black/40 border border-gray-800 rounded-xl p-4">
                  <p className="text-[#cda7f3] font-bold mb-3 text-sm">{i + 1}. {q.text}</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded mb-3 inline-block font-bold border
                    border-gray-700 text-gray-500">
                    {stats.type === 'open_ended' ? 'Açık Uçlu' : 'Çoktan Seçmeli'}
                  </span>

                  {stats.type === 'multiple_choice' && 'counts' in stats && (
                    <div className="space-y-2 mt-2">
                      {Object.entries(stats.counts).map(([opt, cnt]) => {
                        const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0;
                        return (
                          <div key={opt} className="flex items-center gap-3">
                            <span className="text-xs text-gray-300 w-28 shrink-0 truncate">{opt}</span>
                            <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                              <div className="h-full bg-[#8a2be2] rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[#cda7f3] w-10 text-right">{cnt} <span className="text-gray-600">({pct}%)</span></span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {stats.type === 'open_ended' && 'answers' in stats && (
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto terminal-scroll pr-1">
                      {stats.answers.length === 0 ? (
                        <p className="text-gray-600 text-xs italic">Henüz cevap yok.</p>
                      ) : stats.answers.map((ans, j) => (
                        <div key={j} className="bg-[#050505] border border-gray-800 rounded-lg px-3 py-2 text-gray-300 text-sm italic">
                          "{ans}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
  const [resultsSurvey, setResultsSurvey] = useState<SurveyEntry | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { text: '', options: ['', ''], type: 'multiple_choice' },
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
    setQuestions([...questions, { text: '', options: ['', ''], type: 'multiple_choice' }]);

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
      const qType = q.type || 'multiple_choice';
      if (qType === 'multiple_choice' && q.options.some(o => !o.trim())) {
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
    setQuestions([{ text: '', options: ['', ''], type: 'multiple_choice' }]);
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
      {resultsSurvey && <ResultsModal survey={resultsSurvey} onClose={() => setResultsSurvey(null)} />}

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
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {/* Sonuçları Gör */}
                  <button
                    onClick={() => setResultsSurvey(s)}
                    className="px-4 py-2 bg-[#8a2be2]/10 border border-[#8a2be2]/40 text-[#cda7f3] hover:bg-[#8a2be2] hover:text-white text-xs font-bold transition-all uppercase rounded"
                  >
                    📊 Sonuçları Gör
                  </button>
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
