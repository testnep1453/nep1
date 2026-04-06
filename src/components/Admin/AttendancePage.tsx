import { useState, useEffect } from 'react';
import { Student } from '../../types/student';
import { getAttendanceForLesson } from '../../services/dbFirebase';
import { formatLessonDate } from '../../config/lessonSchedule';

interface AttendanceEntry {
  studentId: string;
  joinedAt: number;
  autoJoined: boolean;
}

export const AttendancePage = ({ students }: { students: Student[] }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [records, setRecords] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Son 8 perşembeyi hesapla
  const generateRecentThursdays = (): string[] => {
    const thursdays: string[] = [];
    const now = new Date();
    const current = new Date(now);
    const dayOfWeek = current.getDay();
    const diff = (dayOfWeek <= 4 ? 4 - dayOfWeek : 7 - dayOfWeek + 4);
    current.setDate(current.getDate() + diff);
    if (current > now) current.setDate(current.getDate() - 7);
    for (let i = 0; i < 8; i++) {
      thursdays.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() - 7);
    }
    return thursdays;
  };

  const dates = generateRecentThursdays();

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(dates[0] || '');
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      getAttendanceForLesson(selectedDate).then(r => {
        setRecords(r);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [selectedDate]);

  const attendanceRate = students.length > 0 ? Math.round((records.length / students.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tarih Seçici */}
      <div className="flex flex-wrap gap-2">
        {dates.map(d => (
          <button key={d} onClick={() => setSelectedDate(d)}
            className={`px-4 py-2 rounded text-xs font-mono transition-all ${
              selectedDate === d
                ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50'
                : 'bg-[#0A1128] text-gray-500 border border-gray-800 hover:border-gray-600'
            }`}>
            {formatLessonDate(d)}
          </button>
        ))}
      </div>

      {/* İstatistik */}
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

      {/* Liste */}
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
                      {attended ? (
                        <span className="text-[#39FF14] text-xs font-bold">✅ KATILDI</span>
                      ) : (
                        <span className="text-[#FF4500] text-xs font-bold">❌ KATILMADI</span>
                      )}
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
    </div>
  );
};
