import { Student } from '../../types/student';
import { LESSON_CONFIG } from '../../config/lessonSchedule';

export const ActivityPage = ({ student }: { student: Student }) => {
  const attendanceHistory = student.attendanceHistory || [];
  const streak = student.streak || 0;
  const totalLessons = attendanceHistory.length;

  // Son 8 ders tarihini oluştur (perşembe günleri)
  const generateRecentThursdays = (count: number): string[] => {
    const thursdays: string[] = [];
    const now = new Date();
    const current = new Date(now);
    // Bu haftanın perşembesini bul
    const dayOfWeek = current.getDay();
    const diff = (dayOfWeek <= 4 ? 4 - dayOfWeek : 7 - dayOfWeek + 4);
    current.setDate(current.getDate() + diff);
    if (current > now) current.setDate(current.getDate() - 7); // geçmişteki perşembe

    for (let i = 0; i < count; i++) {
      thursdays.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() - 7);
    }
    return thursdays;
  };

  const recentDates = generateRecentThursdays(8);
  const attendedDates = new Set(attendanceHistory.map(a => a.lessonDate));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Seri ve İstatistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A1128]/80 border border-[#FF9F43]/30 p-5 rounded-lg text-center">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-3xl font-bold text-[#FF9F43]">{streak}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Güncel Seri</div>
        </div>
        <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-5 rounded-lg text-center">
          <div className="text-3xl mb-1">📚</div>
          <div className="text-3xl font-bold text-[#00F0FF]">{totalLessons}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Toplam Ders</div>
        </div>
        <div className="bg-[#0A1128]/80 border border-[#39FF14]/30 p-5 rounded-lg text-center">
          <div className="text-3xl mb-1">⚡</div>
          <div className="text-3xl font-bold text-[#39FF14]">{student.xp || 0}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Toplam XP</div>
        </div>
      </div>

      {/* Devam Tablosu */}
      <div className="bg-[#0A1128]/80 border border-[#6358cc]/30 p-6 rounded-lg">
        <h3 className="text-[#8b7fd8] font-bold text-sm uppercase tracking-wider mb-4">📅 Son Dersler</h3>
        <div className="space-y-2">
          {recentDates.map(date => {
            const attended = attendedDates.has(date);
            const record = attendanceHistory.find(a => a.lessonDate === date);
            return (
              <div key={date} className={`flex items-center justify-between p-3 rounded border ${
                attended ? 'bg-[#39FF14]/5 border-[#39FF14]/20' : 'bg-gray-900/30 border-gray-800'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{attended ? '✅' : '❌'}</span>
                  <div>
                    <div className="text-sm text-white font-mono">{date}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(date + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </div>
                {attended && record && (
                  <div className="text-xs text-[#39FF14] font-mono">
                    +{record.xpEarned} XP {record.autoJoined && '🤖'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Haftalık Program */}
      <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-6 rounded-lg">
        <h3 className="text-[#00F0FF] font-bold text-sm uppercase tracking-wider mb-2">⏰ Haftalık Program</h3>
        <p className="text-gray-400 text-sm">
          Her <span className="text-white font-bold">{LESSON_CONFIG.dayName}</span> günü{' '}
          <span className="text-[#00F0FF] font-bold">{LESSON_CONFIG.startHour}:00 - {LESSON_CONFIG.endHour}:00</span> arası ders var.
        </p>
      </div>
    </div>
  );
};
