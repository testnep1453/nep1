import { useState, useEffect } from 'react';
import { Student } from '../../types/student';
import { getAttendanceForLesson } from '../../services/dbFirebase';
import { FIXED_LESSON_SCHEDULE } from '../../config/lessonSchedule';

interface AttendanceEntry {
  studentId: string;
  joinedAt: number;
  autoJoined: boolean;
}

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatDate(dateStr: string): string {
  const [_y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_TR[m - 1]}`;
}

export const AttendancePage = ({ students }: { students: Student[] }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [records, setRecords] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Geçmiş + bugünkü dersler (henüz bitmeyen lessonlar hariç)
  const now = new Date();
  const pastLessons = FIXED_LESSON_SCHEDULE.filter(l => {
    const [y, m, d] = l.date.split('-').map(Number);
    const end = new Date(y, m - 1, d, 20, 0, 0);
    return now >= end;
  });

  // Sonraki düzeni: son olan en başta (en güncel)
  const sortedLessons = [...pastLessons].reverse();

  useEffect(() => {
    if (!selectedDate && sortedLessons.length > 0) {
      setSelectedDate(sortedLessons[0].date);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      getAttendanceForLesson(selectedDate)
        .then(r => { setRecords(r); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [selectedDate]);

  const attendanceRate = students.length > 0
    ? Math.round((records.length / students.length) * 100) : 0;

  const selectedLesson = FIXED_LESSON_SCHEDULE.find(l => l.date === selectedDate);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Ders Seçici — buton banterı */}
      <div className="flex flex-wrap gap-2">
        {sortedLessons.map(l => (
          <button key={l.date} onClick={() => setSelectedDate(l.date)}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
              selectedDate === l.date
                ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50'
                : 'bg-[#0A1128] text-gray-500 border border-gray-800 hover:border-gray-600'
            }`}>
            <span className="font-bold">Ders {l.lessonNo}</span>
            <span className="ml-1.5 opacity-60">{formatDate(l.date)}</span>
          </button>
        ))}
        {sortedLessons.length === 0 && (
          <p className="text-gray-600 text-sm font-mono">Henüz tamamlanmış ders yok.</p>
        )}
      </div>

      {selectedDate && (
        <>
          {/* Başlık */}
          <div className="text-center">
            <p className="text-xs text-gray-600 font-mono uppercase tracking-widest">
              Ders {selectedLesson?.lessonNo} — {selectedDate}
            </p>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0A1128]/80 border border-[#39FF14]/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#39FF14]">{records.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Katılan</div>
            </div>
            <div className="bg-[#0A1128]/80 border border-[#FF4500]/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FF4500]">{students.length - records.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Katılmayan</div>
            </div>
            <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#00F0FF]">%{attendanceRate}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Katılım</div>
            </div>
          </div>

          {/* Tablo */}
          <div className="bg-[#0A1128]/60 border border-gray-800 rounded overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500 animate-pulse">Yükleniyor...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-700 font-mono text-gray-400 text-xs">
                    <th className="p-3 font-normal">ID</th>
                    <th className="p-3 font-normal">İSİM</th>
                    <th className="p-3 font-normal">DURUM</th>
                    <th className="p-3 font-normal hidden sm:table-cell">SAAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {students.map(stu => {
                    const record = records.find(r => r.studentId === stu.id);
                    const attended = !!record;
                    return (
                      <tr key={stu.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono text-[#39FF14] text-sm">{stu.id}</td>
                        <td className="p-3 font-bold text-sm">{stu.name}</td>
                        <td className="p-3">
                          {attended
                            ? <span className="text-[#39FF14] text-xs font-bold">✅ KATILDI</span>
                            : <span className="text-[#FF4500] text-xs font-bold">❌ KATILMADI</span>}
                        </td>
                        <td className="p-3 hidden sm:table-cell text-xs text-gray-500 font-mono">
                          {record ? new Date(record.joinedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};
