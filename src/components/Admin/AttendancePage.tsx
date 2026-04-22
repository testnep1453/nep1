import { useState, useEffect } from 'react';
import { Student } from '../../types/student';
import { getAttendanceForLesson, recordAttendance } from '../../services/supabaseService';
import { FIXED_LESSON_SCHEDULE } from '../../config/lessonSchedule';
import { supabase } from '../../config/supabase';

interface AttendanceEntry {
  studentId: string;
  joinedAt: number;
  autoJoined: boolean;
}

const HIDDEN_IDS = new Set(['1001', '1002', '1003']);
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function formatDate(dateStr: string): string {
  const [_y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_TR[m - 1]}`;
}

export const AttendancePage = ({ students }: { students: Student[] }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [records, setRecords] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const visibleStudents = students.filter(s => !HIDDEN_IDS.has(s.id));
  const pastLessons = FIXED_LESSON_SCHEDULE.filter(l => {
    const [y, m, d] = l.date.split('-').map(Number);
    return new Date() >= new Date(y, m - 1, d, 20, 0, 0);
  });
  const sortedLessons = [...pastLessons].reverse();

  useEffect(() => {
    if (!selectedDate && sortedLessons.length > 0) setSelectedDate(sortedLessons[0].date);
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    getAttendanceForLesson(selectedDate).then((data: any) => {
      setRecords((data || []).map((r: any) => ({
        studentId: r.studentId,
        joinedAt: new Date(r.joinedAt || Date.now()).getTime(),
        autoJoined: r.autoJoined
      })));
      setLoading(false);
    }).catch(() => setLoading(false));

    const channel = supabase.channel(`public:attendance:${selectedDate}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'attendance',
        filter: `"lessonDate"=eq.${selectedDate}`
      }, () => {
        getAttendanceForLesson(selectedDate).then((data: any) => {
          setRecords((data || []).map((r: any) => ({
            studentId: r.studentId,
            joinedAt: new Date(r.joinedAt || Date.now()).getTime(),
            autoJoined: r.autoJoined
          })));
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDate]);

  const toggleAttendance = async (studentId: string) => {
    if (!selectedDate) return;
    const isPresent = records.some(r => r.studentId === studentId);
    setSavingId(studentId);
    try {
      if (!isPresent) {
        await recordAttendance(studentId, selectedDate, false);
      } else {
        await supabase.from('attendance').delete()
          .eq('"studentId"', studentId)
          .eq('"lessonDate"', selectedDate);
      }
      const data: any = await getAttendanceForLesson(selectedDate);
      setRecords((data || []).map((r: any) => ({
        studentId: r.studentId,
        joinedAt: new Date(r.joinedAt || Date.now()).getTime(),
        autoJoined: r.autoJoined
      })));
    } catch (e) {
      alert('Hata: ' + (e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {sortedLessons.map(l => (
          <button key={l.date} onClick={() => setSelectedDate(l.date)}
            className={`px-3 py-1.5 rounded text-xs font-mono border ${selectedDate === l.date ? 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]' : 'bg-[#0A1128] text-gray-500 border-gray-800'}`}>
            Ders {l.lessonNo} - {formatDate(l.date)}
          </button>
        ))}
      </div>
      <div className="bg-[#0A1128]/60 border border-gray-800 rounded overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-xs">
              <th className="p-3">ID</th><th className="p-3">İSİM</th><th className="p-3">DURUM</th>
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map(stu => {
              const record = records.find(r => r.studentId === stu.id);
              const attended = !!record;
              return (
                <tr key={stu.id} onClick={() => savingId !== stu.id && toggleAttendance(stu.id)} className="border-b border-gray-800 cursor-pointer hover:bg-white/5">
                  <td className="p-3 text-[#39FF14]">{stu.id}</td>
                  <td className="p-3 font-bold">{stu.name}</td>
                  <td className="p-3">
                    {savingId === stu.id ? '...' : attended ? '✅ KATILDI' : '❌ KATILMADI'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};