import { useState, useEffect } from 'react';
import { FeedbackEntry } from '../../types/student';
import { getAllFeedback } from '../../services/supabaseService';
import { FeedbackForm } from './FeedbackForm';
import { formatLessonDate } from '../../config/lessonSchedule';

export const FeedbackHistory = ({ studentId }: { studentId: string }) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const all = await getAllFeedback();
      // Sadece bu öğrencinin geri bildirimlerini göster
      setFeedbackList(all.filter(f => f.studentId === studentId));
    } catch {
      setFeedbackList([]);
    }
    setLoading(false);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Yeni Geri Bildirim */}
      <div className="bg-[#0A1128]/80 border border-[#FF9F43]/30 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[#FF9F43] font-bold text-sm uppercase tracking-wider">📝 Geri Bildirim Gönder</h3>
        </div>
        <p className="text-gray-500 text-sm mb-4">Son ders hakkında düşüncelerin neler?</p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#FF9F43]/20 hover:bg-[#FF9F43] text-[#FF9F43] hover:text-black border border-[#FF9F43] px-6 py-3 font-bold transition-all uppercase tracking-widest rounded text-sm"
        >
          Yeni Geri Bildirim
        </button>
      </div>

      {showForm && (
        <FeedbackForm
          lessonDate={today}
          studentId={studentId}
          onClose={() => { setShowForm(false); loadFeedback(); }}
        />
      )}

      {/* Geçmiş */}
      <div className="bg-[#0A1128]/80 border border-[#6358cc]/30 p-6 rounded-lg">
        <h3 className="text-[#8b7fd8] font-bold text-sm uppercase tracking-wider mb-4">📋 Geçmiş Geri Bildirimler</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">Yükleniyor...</div>
        ) : feedbackList.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-600 text-sm">Henüz geri bildirim göndermedin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbackList.map(fb => (
              <div key={fb.id} className="bg-[#050505]/50 border border-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={`text-sm ${s <= fb.rating ? '' : 'opacity-20'}`}>⭐</span>
                    ))}
                  </div>
                  <span className="text-gray-600 text-xs font-mono">
                    {formatLessonDate(fb.lessonDate)}
                  </span>
                </div>
                {fb.comment && <p className="text-gray-300 text-sm">"{fb.comment}"</p>}
                {fb.image_url && (
                  <a href={fb.image_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    <img src={fb.image_url} alt="Geri bildirim görseli" className="max-h-40 rounded-lg object-cover" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



