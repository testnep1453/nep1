/**
 * Geri Bildirim Formu - Ders bittikten 15 dakika sonra açılır, ders özeldir.
 */

import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { FIXED_LESSON_SCHEDULE } from '../../config/lessonSchedule';

interface FeedbackFormProps {
  lessonDate: string;
  studentId: string;
  onClose: () => void;
}

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_TR[m - 1]} ${y}`;
}

function getLessonNo(dateStr: string): number | null {
  return FIXED_LESSON_SCHEDULE.find(l => l.date === dateStr)?.lessonNo ?? null;
}

/** Ders 20:15'ten önce mi? Eğer öyleyse form açılmamalı */
export function isFeedbackTime(lessonDate: string): boolean {
  const now = Date.now();
  const [y, m, d] = lessonDate.split('-').map(Number);
  // Ders sonu 20:00 + 15 dk = 20:15
  const openAt = new Date(y, m - 1, d, 20, 15, 0).getTime();
  
  // Sonraki ders günü (haftaya) 19:00'da kapansın
  const closeAt = new Date(y, m - 1, d + 7, 19, 0, 0).getTime();

  return now >= openAt && now < closeAt;
}

export const FeedbackForm = ({ lessonDate, studentId: _studentId, onClose }: FeedbackFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const lessonNo = getLessonNo(lessonDate);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await supabase.from('feedback').insert([{
        studentId: 'anonymous',
        lessonDate,
        lessonNo,
        rating,
        comment: comment.trim(),
        createdAt: Date.now(),
        anonymous: true,
      }]);
      // Gösterildi işareti artık AgentDashboard'da Supabase'e yazılır
      setSubmitted(true);
    } catch (error) {
      console.error('Geri bildirim hatası:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#0A1128] border border-[#39FF14]/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-[#39FF14] mb-2">Teşekkürler!</h3>
          <p className="text-gray-400 mb-6">Geri bildirimin kaydedildi.</p>
          <button onClick={onClose}
            className="bg-[#39FF14]/20 hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14] py-3 px-8 font-bold transition-all uppercase tracking-widest rounded-lg">
            Kapat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A1128] border border-[#6358cc]/30 rounded-2xl p-6 sm:p-8 max-w-md w-full">

        {/* Başlık */}
        <div className="text-center mb-6">
          <p className="text-[10px] text-white/30 uppercase tracking-[3px] font-mono mb-1">Ders Geri Bildirimi</p>
          <h3 className="text-xl font-black text-white uppercase tracking-wider">
            {lessonNo ? `Ders ${lessonNo}` : 'Bu Ders'}
          </h3>
          <p className="text-xs text-white/30 font-mono mt-1">{formatDate(lessonDate)}</p>
          <p className="text-gray-500 text-xs mt-3">Bu form tamamen anonimdir.</p>
        </div>

        {/* Yıldız Derecelendirme */}
        <div className="mb-6">
          <p className="text-white/50 text-xs mb-3 text-center uppercase tracking-widest">Dersi nasıl buldun?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)}
                className={`text-3xl sm:text-4xl transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  star <= rating
                    ? 'scale-110 drop-shadow-[0_0_8px_rgba(245,211,46,0.6)]'
                    : 'opacity-25 hover:opacity-60'
                }`}>
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Yorum */}
        <div className="mb-6">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Eklemek istediğin bir şey? (opsiyonel)"
            rows={3}
            className="w-full bg-[#050505] border border-gray-700 text-white p-3 focus:outline-none focus:border-[#6358cc] rounded-lg transition-colors resize-none text-sm" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 border border-gray-700 py-3 font-bold transition-all uppercase tracking-widest rounded-lg text-sm min-h-[48px]">
            Geç
          </button>
          <button onClick={handleSubmit} disabled={rating === 0 || submitting}
            className="flex-1 bg-[#6358cc]/20 hover:bg-[#6358cc] text-[#8b7fd8] hover:text-white border border-[#6358cc] py-3 font-bold transition-all uppercase tracking-widest rounded-lg disabled:opacity-30 text-sm min-h-[48px]">
            {submitting ? 'Gönderiliyor...' : 'Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
};



