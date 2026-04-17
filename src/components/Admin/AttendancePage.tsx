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
    setLoading(true);
    getAttendanceForLesson(selectedDate).then(data => {
      setRecords((data || []).map((r: any) => ({
        studentId: r.studentId,
        joinedAt: new Date(r.joinedAt || Date.now()).getTime(),
        autoJoined: r.autoJoined
      })));
      setLoading(false);
    }).catch(() => setLoading(false));

    // Realtime subscription - use snake_case in filter
    const channel = supabase.channel(`public:attendance:${selectedDate}`)
      .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'attendance', 
          filter: `"lessonDate"=eq.${selectedDate}` 
      }, () => {
        getAttendanceForLesson(selectedDate).then(data => {
           const mapped: AttendanceEntry[] = (data || []).map((r: any) => ({
             studentId: r.studentId,
             joinedAt: new Date(r.joinedAt || Date.now()).getTime(),
             autoJoined: r.autoJoined
           }));
           setRecords(mapped);
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
        // Katılmadı olarak işaretle — Supabase'den sil (camelCase)
        await supabase.from('attendance').delete()
          .eq('studentId', studentId)
          .eq('lessonDate', selectedDate);
      }
      const data = await getAttendanceForLesson(selectedDate);
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
    <div className="space-y-5 animate-fade-in">
      {/* Sekme */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('ders')}
          className={`px-4 py-2 text-xs font-bold rounded transition-all ${tab === 'ders' ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50' : 'bg-[#0A1128] text-gray-500 border border-gray-800 hover:border-gray-600'}`}
        >
          📋 Ders Yoklaması
        </button>
        <button
          onClick={() => setTab('oranlar')}
          className={`px-4 py-2 text-xs font-bold rounded transition-all ${tab === 'oranlar' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50' : 'bg-[#0A1128] text-gray-500 border border-gray-800 hover:border-gray-600'}`}
        >
          📊 Katılım Oranları
        </button>
      </div>

      {/* ── DERS YOKLAMASI ── */}
      {tab === 'ders' && (
        <>
          {/* Ders Seçici */}
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
              {/* İstatistik kartları */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0A1128]/80 border border-[#39FF14]/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#39FF14]">
                    {records.filter(r => !HIDDEN_IDS.has(r.studentId)).length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Katılan</div>
                </div>
                <div className="bg-[#0A1128]/80 border border-[#FF4500]/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#FF4500]">
                    {visibleStudents.length - records.filter(r => !HIDDEN_IDS.has(r.studentId)).length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Katılmayan</div>
                </div>
                <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[#00F0FF]">%{lessonAttendanceRate}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Oran</div>
                </div>
              </div>

              {/* Başlık + düzenleme uyarısı */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 font-mono">
                  Ders {selectedLesson?.lessonNo} — {selectedDate} &nbsp;·&nbsp; Satıra tıklayarak katılım düzenle
                </p>
              </div>

              {/* Tablo */}
              <div className="bg-[#0A1128]/60 border border-gray-800 rounded overflow-x-auto">
                {loading ? (
                  <div className="text-center py-8 text-gray-500 animate-pulse">Yükleniyor…</div>
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
                      {visibleStudents.map(stu => {
                        const record = records.find(r => r.studentId === stu.id);
                        const attended = !!record;
                        const isSaving = savingId === stu.id;
                        return (
                          <tr
                            key={stu.id}
                            onClick={() => !isSaving && toggleAttendance(stu.id)}
                            className={`transition-colors cursor-pointer select-none ${attended ? 'hover:bg-[#39FF14]/5' : 'hover:bg-[#FF4500]/5'}`}
                          >
                            <td className="p-3 font-mono text-[#39FF14] text-sm">{stu.id}</td>
                            <td className="p-3 font-bold text-sm">{stu.name}</td>
                            <td className="p-3">
                              {isSaving ? (
                                <span className="text-yellow-400 text-xs font-bold animate-pulse">Kaydediliyor…</span>
                              ) : attended ? (
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
            </>
          )}
        </>
      )}

      {/* ── KATILIM ORANLARI ── */}
      {tab === 'oranlar' && (
        <>
          {/* Genel oran */}
          {overallRate !== null && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0A1128]/80 border border-[#6358cc]/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#6358cc]">{pastLessons.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Toplam Ders</div>
              </div>
              <div className="bg-[#0A1128]/80 border border-[#39FF14]/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#39FF14]">{visibleStudents.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Aktif Ajan</div>
              </div>
              <div className="bg-[#0A1128]/80 border border-[#00F0FF]/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-[#00F0FF]">%{overallRate}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Genel Katılım</div>
              </div>
            </div>
          )}

          {statsLoading ? (
            <div className="text-center py-12 text-gray-500 animate-pulse">Veriler hesaplanıyor…</div>
          ) : (
            <div className="bg-[#0A1128]/60 border border-gray-800 rounded overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-700 font-mono text-gray-400 text-xs">
                    <th className="p-3 font-normal">AJAN</th>
                    <th className="p-3 font-normal text-center">KATILDI</th>
                    <th className="p-3 font-normal text-center">TOPLAM</th>
                    <th className="p-3 font-normal">ORAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {[...visibleStudents]
                    .sort((a, b) => (studentStats[b.id]?.rate ?? 0) - (studentStats[a.id]?.rate ?? 0))
                    .map(stu => {
                      const s = studentStats[stu.id] ?? { attended: 0, total: 0, rate: 0 };
                      const color = s.rate >= 75 ? '#39FF14' : s.rate >= 50 ? '#FFB000' : '#FF4500';
                      return (
                        <tr key={stu.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-sm">{stu.name}</div>
                            <div className="text-xs text-gray-600 font-mono">{stu.id}</div>
                          </td>
                          <td className="p-3 text-center font-mono text-sm" style={{ color }}>{s.attended}</td>
                          <td className="p-3 text-center font-mono text-sm text-gray-500">{s.total}</td>
                          <td className="p-3 w-40">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${s.rate}%`, backgroundColor: color }}
                                />
                              </div>
                              <span className="text-xs font-bold font-mono w-9 text-right" style={{ color }}>%{s.rate}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {pastLessons.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-sm">Henüz tamamlanmış ders yok.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};