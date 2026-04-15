import { useState, useEffect } from 'react';
import { subscribeToSettingStore } from '../../services/dbFirebase';
import type { SurveyEntry } from '../Admin/SurveyManager';

export const SurveysClient = () => {
  const [surveys, setSurveys] = useState<SurveyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToSettingStore<SurveyEntry[]>('surveys', [], (data) => {
      setSurveys(Array.isArray(data) ? data.filter(s => s.isActive) : []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
        ) : surveys.length === 0 ? (
          <div className="text-center py-12 relative z-10">
            <span className="text-4xl opacity-50 mb-4 block">📡</span>
            <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">Şu an aktif bir sorgu / görev bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {surveys.map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="block bg-[#0A1128]/80 border border-[#8a2be2]/30 hover:border-[#8a2be2] p-5 rounded-lg transition-all hover:bg-[#8a2be2]/10 hover:scale-[1.02]">
                <div className="flex flex-col h-full">
                  <h4 className="text-white font-bold text-lg mb-2">{s.title}</h4>
                  <p className="text-gray-400 text-sm mb-4 flex-1">{s.description}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-[#8a2be2]/20 pt-3">
                    <span className="text-xs text-gray-500 font-mono">ID: {s.id.slice(-6)}</span>
                    <span className="text-xs font-bold text-[#cda7f3] uppercase tracking-wider bg-[#8a2be2]/20 px-3 py-1 rounded">
                      GÖREVE GİT ➔
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
