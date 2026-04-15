import { useState, useEffect } from 'react';
import { subscribeToSettingStore } from '../../services/dbFirebase';
import type { SurveyEntry } from '../Admin/SurveyManager';
import { supabase } from '../../config/supabase';

export const SurveysClient = () => {
  const [surveys, setSurveys] = useState<SurveyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSurvey, setActiveSurvey] = useState<SurveyEntry | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Okunan görevleri storage'dan çek
    const saved = localStorage.getItem('completed_surveys');
    if (saved) setCompleted(new Set(JSON.parse(saved)));

    const unsub = subscribeToSettingStore<SurveyEntry[]>('surveys', [], (data) => {
      setSurveys(Array.isArray(data) ? data.filter(s => s.isActive) : []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!activeSurvey) return;
    setSubmitting(true);
    
    // Anonim kaydet
    try {
      await supabase.from('survey_results').insert([{
        surveyId: activeSurvey.id,
        answers,
        createdAt: Date.now()
      }]);
      
      const newCompleted = new Set(completed).add(activeSurvey.id);
      setCompleted(newCompleted);
      localStorage.setItem('completed_surveys', JSON.stringify(Array.from(newCompleted)));
      setActiveSurvey(null);
      setAnswers({});
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (activeSurvey) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-[#0A1128]/90 border border-[#8a2be2]/30 p-6 rounded-2xl relative">
          <button onClick={() => setActiveSurvey(null)} className="text-[#8a2be2] mb-4 text-sm font-bold tracking-widest hover:text-white uppercase transition-colors">
            ← GERİ DÖN
          </button>
          <h3 className="text-2xl text-white font-black uppercase mb-2">{activeSurvey.title}</h3>
          <p className="text-gray-400 mb-8">{activeSurvey.description}</p>

          <div className="space-y-6">
            {activeSurvey.questions?.map((q, i) => (
              <div key={i} className="bg-black/50 p-4 rounded-lg border border-gray-800">
                <p className="font-bold text-[#cda7f3] mb-4">{i + 1}. {q.text}</p>
                <div className="space-y-2">
                  {q.options.map((opt, j) => (
                    <label key={j} className="flex items-center gap-3 p-3 rounded bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-[#8a2be2]/50">
                      <input type="radio" name={`q-${i}`} value={opt} checked={answers[i] === opt} onChange={() => setAnswers({...answers, [i]: opt})} className="accent-[#8a2be2]" />
                      <span className="text-sm text-gray-200">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={handleSubmit} disabled={submitting || Object.keys(answers).length !== (activeSurvey.questions?.length || 0)} className="w-full mt-6 bg-[#8a2be2] hover:bg-[#a14df3] text-white py-4 rounded-lg font-bold uppercase tracking-widest transition-all disabled:opacity-50">
            {submitting ? 'GÖNDERİLİYOR...' : 'GÖREVİ TAMAMLA'}
          </button>
        </div>
      </div>
    );
  }

  // Koşullu görünüm (Eğer anket yoksa boş döner. AgentDashboard tabs kısmından gizleme ayrıntısı yapılacak)
  if (!loading && surveys.length === 0) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-[#0A1128] to-[#050505] border-t-2 border-[#8a2be2]/30 p-6 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(138,43,226,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,43,226,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <h3 className="text-white font-black text-xl tracking-[4px] uppercase flex items-center gap-3">
            <span className="text-[#8a2be2] text-2xl">📋</span>
            Sorgu Odası
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-10 text-[#8a2be2] animate-pulse relative z-10">Bağlantı Kuruluyor...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {surveys.map(s => {
              const isDone = completed.has(s.id);
              return (
              <div key={s.id} onClick={() => !isDone && setActiveSurvey(s)} className={`block bg-[#0A1128]/80 border border-[#8a2be2]/30 p-5 rounded-lg transition-all ${isDone ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-[#8a2be2] hover:bg-[#8a2be2]/10 hover:scale-[1.02] cursor-pointer'}`}>
                <div className="flex flex-col h-full">
                  <h4 className="text-white font-bold text-lg mb-2">{s.title}</h4>
                  <p className="text-gray-400 text-sm mb-4 flex-1">{s.description}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-[#8a2be2]/20 pt-3">
                    <span className="text-xs text-gray-500 font-mono">ID: {s.id.slice(-6)}</span>
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded ${isDone ? 'bg-green-500/20 text-green-400' : 'bg-[#8a2be2]/20 text-[#cda7f3]'}`}>
                      {isDone ? 'TAMAMLANDI ✓' : 'GÖREVE GİT ➔'}
                    </span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

