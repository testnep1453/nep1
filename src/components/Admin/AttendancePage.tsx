import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Student } from '../../types/student';
import { FIXED_LESSON_SCHEDULE } from '../../config/lessonSchedule';
import { supabase } from '../../config/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const HIDDEN_IDS = new Set(['1001', '1002', '1003']);

const MONTHS_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AttendanceRow {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent';
  created_at: string;
}

interface ExcelPreviewRow {
  student_id: string;
  date: string;
  status: 'present' | 'absent';
  valid: boolean;
  error?: string;
}

type TabId = 'stats' | 'manual' | 'excel';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_TR[m - 1]}`;
}

function isPast(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date() >= new Date(y, m - 1, d, 20, 0, 0);
}

const pastLessons = FIXED_LESSON_SCHEDULE.filter(l => isPast(l.date));
const sortedLessons = [...pastLessons].sort((a, b) => b.date.localeCompare(a.date));

// ─── Sub-components ────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-mono font-bold tracking-widest uppercase rounded-t border-b-2 transition-all ${
        active
          ? 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]'
          : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function Toast({ message, type, onClose }: {
  message: string; type: 'success' | 'error'; onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded border font-mono text-sm shadow-lg ${
      type === 'success'
        ? 'bg-[#001a00] border-[#39FF14] text-[#39FF14]'
        : 'bg-[#1a0000] border-red-500 text-red-400'
    }`}>
      {type === 'success' ? '✓ ' : '✗ '}{message}
    </div>
  );
}

// ─── Tab 1: Stats ──────────────────────────────────────────────────────────────

function StatsTab({ students, allRows }: { students: Student[]; allRows: AttendanceRow[] }) {
  const totalPast = pastLessons.length;

  // Per-student attendance %
  const studentStats = students.map(s => {
    const present = allRows.filter(r => r.student_id === s.id && r.status === 'present').length;
    const pct = totalPast > 0 ? Math.round((present / totalPast) * 100) : 0;
    return { ...s, present, pct };
  }).sort((a, b) => b.pct - a.pct);

  // Overall attendance %
  const totalPresent = allRows.filter(r => r.status === 'present').length;
  const totalPossible = totalPast * students.length;
  const overallPct = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

  // Weekly chart data
  const chartData = sortedLessons.slice().reverse().map(l => {
    const rows = allRows.filter(r => r.date === l.date);
    const pct = students.length > 0
      ? Math.round((rows.filter(r => r.status === 'present').length / students.length) * 100)
      : 0;
    return { date: fmt(l.date), pct, lesson: `Ders ${l.lessonNo}` };
  });

  return (
    <div className="space-y-6">
      {/* Overall KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0A1128]/80 border border-[#39FF14]/30 rounded p-4 text-center">
          <div className="text-[#39FF14] text-3xl font-mono font-bold">{overallPct}%</div>
          <div className="text-gray-400 text-xs mt-1 tracking-widest uppercase">Genel Katılım</div>
        </div>
        <div className="bg-[#0A1128]/80 border border-gray-800 rounded p-4 text-center">
          <div className="text-white text-3xl font-mono font-bold">{totalPast}</div>
          <div className="text-gray-400 text-xs mt-1 tracking-widest uppercase">Geçmiş Ders</div>
        </div>
        <div className="bg-[#0A1128]/80 border border-gray-800 rounded p-4 text-center">
          <div className="text-white text-3xl font-mono font-bold">{students.length}</div>
          <div className="text-gray-400 text-xs mt-1 tracking-widest uppercase">Öğrenci</div>
        </div>
      </div>

      {/* Weekly Chart */}
      {chartData.length > 0 && (
        <div className="bg-[#0A1128]/60 border border-gray-800 rounded p-4">
          <div className="text-gray-300 text-xs font-mono font-bold mb-4 tracking-widest uppercase">
            Haftalık Katılım Oranı
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2a1a" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} unit="%" />
              <Tooltip
                contentStyle={{ background: '#0A1128', border: '1px solid #39FF14', borderRadius: 4 }}
                labelStyle={{ color: '#39FF14', fontSize: 11, fontFamily: 'monospace' }}
                itemStyle={{ color: '#fff', fontSize: 11, fontFamily: 'monospace' }}
                formatter={(v) => [`${v ?? 0}%`, 'Katılım']}
              />
              <Bar dataKey="pct" fill="#39FF14" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-student table */}
      <div className="bg-[#0A1128]/60 border border-gray-800 rounded overflow-hidden">
        <div className="text-gray-300 text-xs font-mono font-bold p-3 border-b border-gray-800 tracking-widest uppercase">
          Öğrenci Bazlı Katılım
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-xs font-mono">
              <th className="p-3">ID</th>
              <th className="p-3">İSİM</th>
              <th className="p-3 text-center">KATILIM</th>
              <th className="p-3 text-right">YÜZDE</th>
            </tr>
          </thead>
          <tbody>
            {studentStats.map(s => (
              <tr key={s.id} className="border-t border-gray-800 hover:bg-white/5 transition-colors">
                <td className="p-3 text-[#39FF14] font-mono text-xs">{s.id}</td>
                <td className="p-3 text-white font-bold text-sm">{s.name}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.pct}%`,
                          background: s.pct >= 75 ? '#39FF14' : s.pct >= 50 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs font-mono">{s.present}/{totalPast}</span>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <span className={`font-mono font-bold text-sm ${
                    s.pct >= 75 ? 'text-[#39FF14]' : s.pct >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {s.pct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 2: Manual ─────────────────────────────────────────────────────────────

function ManualTab({
  students,
  onToast,
}: {
  students: Student[];
  onToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [selectedDate, setSelectedDate] = useState(sortedLessons[0]?.date ?? '');
  const [dateRows, setDateRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchDate = useCallback(async (date: string) => {
    if (!date) return;
    setLoading(true);
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date);
    setDateRows((data as AttendanceRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDate(selectedDate);
  }, [selectedDate, fetchDate]);

  const toggle = async (studentId: string) => {
    if (!selectedDate || savingId) return;
    const current = dateRows.find(r => r.student_id === studentId);
    const newStatus: 'present' | 'absent' = current?.status === 'present' ? 'absent' : 'present';

    setSavingId(studentId);
    const { error } = await supabase.from('attendance').upsert(
      { student_id: studentId, date: selectedDate, status: newStatus },
      { onConflict: 'student_id,date' }
    );
    if (error) {
      onToast(error.message, 'error');
    } else {
      await fetchDate(selectedDate);
      onToast(`${studentId} → ${newStatus === 'present' ? 'Katıldı' : 'Katılmadı'}`, 'success');
    }
    setSavingId(null);
  };

  const lesson = sortedLessons.find(l => l.date === selectedDate);

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="flex flex-wrap gap-2">
        {sortedLessons.map(l => (
          <button
            key={l.date}
            onClick={() => setSelectedDate(l.date)}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
              selectedDate === l.date
                ? 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]'
                : 'bg-[#0A1128] text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            Ders {l.lessonNo} — {fmt(l.date)}
          </button>
        ))}
      </div>

      {/* Table */}
      {selectedDate && (
        <div className="bg-[#0A1128]/60 border border-gray-800 rounded overflow-hidden">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-gray-300 text-xs font-mono font-bold tracking-widest uppercase">
              {lesson ? `Ders ${lesson.lessonNo}` : ''} — {fmt(selectedDate)}
            </span>
            {loading && (
              <span className="text-[#39FF14] text-xs font-mono animate-pulse">Yükleniyor...</span>
            )}
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900 text-gray-400 text-xs font-mono">
                <th className="p-3">ID</th>
                <th className="p-3">İSİM</th>
                <th className="p-3 text-right">DURUM</th>
              </tr>
            </thead>
            <tbody>
              {students.map(stu => {
                const row = dateRows.find(r => r.student_id === stu.id);
                const isPresent = row?.status === 'present';
                const isSaving = savingId === stu.id;
                return (
                  <tr
                    key={stu.id}
                    className="border-t border-gray-800 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => !isSaving && toggle(stu.id)}
                  >
                    <td className="p-3 text-[#39FF14] font-mono text-xs">{stu.id}</td>
                    <td className="p-3 text-white font-bold text-sm">{stu.name}</td>
                    <td className="p-3 text-right">
                      {isSaving ? (
                        <span className="inline-block w-5 h-5 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <button
                          className={`px-4 py-1.5 rounded text-xs font-mono font-bold border transition-all ${
                            isPresent
                              ? 'bg-[#39FF14]/15 text-[#39FF14] border-[#39FF14]/50 hover:bg-[#39FF14]/25'
                              : 'bg-red-500/10 text-red-400 border-red-500/40 hover:bg-red-500/20'
                          }`}
                          onClick={e => { e.stopPropagation(); !isSaving && toggle(stu.id); }}
                        >
                          {isPresent ? '✓ KATILDI' : '✗ KATILMADI'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-3 border-t border-gray-800 text-xs text-gray-600 font-mono">
            {dateRows.filter(r => r.status === 'present').length} / {students.length} katıldı
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Excel ──────────────────────────────────────────────────────────────

function ExcelTab({ onToast }: { onToast: (msg: string, type: 'success' | 'error') => void }) {
  const [rows, setRows] = useState<ExcelPreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      const parsed: ExcelPreviewRow[] = raw
        .slice(1) // skip header row if present
        .filter((r: unknown[]) => r.some(c => c !== ''))
        .map((r: unknown[]) => {
          const student_id = String(r[0] ?? '').trim();
          const date = String(r[1] ?? '').trim();
          const status = String(r[2] ?? '').trim().toLowerCase() as 'present' | 'absent';

          if (!student_id) return { student_id, date, status, valid: false, error: 'student_id boş' };
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { student_id, date, status, valid: false, error: 'Tarih formatı yanlış (YYYY-MM-DD)' };
          if (!['present', 'absent'].includes(status)) return { student_id, date, status, valid: false, error: 'Durum present/absent olmalı' };

          return { student_id, date, status, valid: true };
        });

      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
  };

  const doImport = async () => {
    const valid = rows.filter(r => r.valid);
    if (!valid.length) return;

    setImporting(true);
    const payload = valid.map(r => ({
      student_id: r.student_id,
      date: r.date,
      status: r.status,
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'student_id,date' });

    if (error) {
      onToast(error.message, 'error');
    } else {
      onToast(`${valid.length} kayıt başarıyla aktarıldı.`, 'success');
      setRows([]);
      if (fileRef.current) fileRef.current.value = '';
    }
    setImporting(false);
  };

  const validCount = rows.filter(r => r.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="space-y-5">
      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-700 hover:border-[#39FF14]/50 rounded p-8 text-center transition-colors">
        <div className="text-gray-500 text-xs font-mono mb-4 tracking-widest uppercase">
          Excel Dosyası Seç (.xlsx / .xls)
        </div>
        <div className="text-gray-600 text-xs font-mono mb-4">
          Sütunlar: A = student_id &nbsp;|&nbsp; B = tarih (YYYY-MM-DD) &nbsp;|&nbsp; C = durum (present/absent)
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="hidden"
          id="excel-upload"
        />
        <label
          htmlFor="excel-upload"
          className="inline-block px-5 py-2 bg-[#0A1128] border border-gray-700 text-gray-300 text-xs font-mono rounded cursor-pointer hover:border-[#39FF14]/60 hover:text-[#39FF14] transition-colors"
        >
          Dosya Seç
        </label>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="bg-[#0A1128]/60 border border-gray-800 rounded overflow-hidden">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
            <span className="text-gray-300 text-xs font-mono font-bold tracking-widest uppercase">
              Önizleme — {rows.length} Satır
            </span>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[#39FF14]">✓ {validCount} geçerli</span>
              {invalidCount > 0 && <span className="text-red-400">✗ {invalidCount} hatalı</span>}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-gray-400 text-xs font-mono">
                  <th className="p-3">STUDENT ID</th>
                  <th className="p-3">TARİH</th>
                  <th className="p-3">DURUM</th>
                  <th className="p-3">DOĞRULAMA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-t border-gray-800 text-xs font-mono ${!r.valid ? 'bg-red-950/20' : ''}`}>
                    <td className="p-3 text-[#39FF14]">{r.student_id || '—'}</td>
                    <td className="p-3 text-gray-300">{r.date || '—'}</td>
                    <td className="p-3">
                      <span className={r.status === 'present' ? 'text-[#39FF14]' : 'text-red-400'}>
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.valid
                        ? <span className="text-[#39FF14]">✓</span>
                        : <span className="text-red-400">✗ {r.error}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {validCount > 0 && (
            <div className="p-3 border-t border-gray-800 flex justify-end">
              <button
                onClick={doImport}
                disabled={importing}
                className="px-5 py-2 bg-[#39FF14]/15 border border-[#39FF14]/50 text-[#39FF14] text-xs font-mono font-bold rounded hover:bg-[#39FF14]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {importing && (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
                )}
                {importing ? 'Aktarılıyor...' : `İçe Aktar (${validCount})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export const AttendancePage = ({ students }: { students: Student[] }) => {
  const [tab, setTab] = useState<TabId>('stats');
  const [allRows, setAllRows] = useState<AttendanceRow[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const visibleStudents = students.filter(s => !HIDDEN_IDS.has(s.id));

  const fetchAll = useCallback(async () => {
    setLoadingAll(true);
    const { data } = await supabase.from('attendance').select('*');
    setAllRows((data as AttendanceRow[]) ?? []);
    setLoadingAll(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refresh stats when switching back to stats tab
  useEffect(() => {
    if (tab === 'stats') fetchAll();
  }, [tab, fetchAll]);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'stats',  label: 'İstatistikler' },
    { id: 'manual', label: 'Manuel Yoklama' },
    { id: 'excel',  label: 'Excel İçe Aktar' },
  ];

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-800 mb-6">
        {tabs.map(t => (
          <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'stats' && (
        loadingAll
          ? <div className="text-[#39FF14] font-mono text-xs animate-pulse py-8 text-center">Veriler yükleniyor...</div>
          : <StatsTab students={visibleStudents} allRows={allRows} />
      )}
      {tab === 'manual' && (
        <ManualTab students={visibleStudents} onToast={showToast} />
      )}
      {tab === 'excel' && (
        <ExcelTab onToast={showToast} />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
