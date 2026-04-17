import { supabase } from '../config/supabase';
import { Student, Trailer, FeedbackEntry } from '../types/student';
import seedData from '../student_list.json';

/**
 * Supabase tabanlı öğrenci ve sistem veri servisi.
 */

export const fetchStudents = async (): Promise<Student[]> => {
  const { data } = await supabase.from('students').select('*');
  if (!data || data.length === 0) return seedData as Student[];

  return data.map(s => ({
    ...s,
    nickname: s.display_name || s.nickname || 'AJAN',
    lastSeen: s.last_seen ? new Date(s.last_seen).getTime() : Date.now(),
    attendanceHistory: s.attendance_history || []
  })) as Student[];
};

export const upsertStudent = async (student: Student) => {
  await supabase.from('students').upsert({
    id: student.id,
    name: student.name,
    nickname: student.nickname,
    display_name: student.nickname,
    email: student.email,
    xp: student.xp,
    level: student.level,
    avatar: student.avatar,
    last_seen: new Date(student.lastSeen || Date.now()).toISOString(),
    attendance_history: student.attendanceHistory || [],
    streak: student.streak || 0,
    badges: student.badges || []
  });
};

export const updateStudent = async (id: string, updates: Partial<Student>) => {
  const mappedUpdates: Record<string, unknown> = { ...updates };

  if (updates.lastSeen) {
    mappedUpdates.last_seen = new Date(updates.lastSeen).toISOString();
    delete mappedUpdates.lastSeen;
  }
  if (updates.attendanceHistory) {
    mappedUpdates.attendance_history = updates.attendanceHistory;
    delete mappedUpdates.attendanceHistory;
  }
  if (updates.nickname) {
    mappedUpdates.display_name = updates.nickname;
  }

  await supabase.from('students').update(mappedUpdates).eq('id', id);
};

export const removeStudent = async (id: string) => {
  await supabase.from('students').delete().eq('id', id);
};

export const subscribeToTrailer = (callback: (trailer: Trailer | null) => void) => {
  const fetchTrailer = async () => {
    const { data } = await supabase.from('settings').select('data').eq('id', 'trailer').maybeSingle();
    callback(data ? (data.data as Trailer) : null);
  };
  fetchTrailer();
  const channelName = `settings_trailer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `id=eq.trailer` }, fetchTrailer)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const setTrailer = async (trailer: Omit<Trailer, 'isActive'>) => {
  await supabase.from('settings').upsert({ id: 'trailer', data: { ...trailer, isActive: true } });
};

export const disableTrailer = async () => {
  await supabase.from('settings').upsert({ id: 'trailer', data: { youtubeId: '', showDate: '', showTime: '', isActive: false } });
};

export const extractYoutubeId = (url: string): string => {
  if (!url) return '';
  const match = url.match(/(?:v\/|youtu\.be\/|v=|embed\/|shorts\/)([^&?\s]{11})/i);
  return match ? match[1] : url.trim();
};

export const addStudentsBatch = async (students: Student[]) => {
  const mapped = students.map(s => ({
    id: s.id,
    name: s.name,
    nickname: s.nickname,
    display_name: s.nickname,
    email: s.email,
    xp: s.xp,
    level: s.level,
    avatar: s.avatar,
    last_seen: new Date(s.lastSeen || Date.now()).toISOString(),
    attendance_history: s.attendanceHistory || [],
    streak: s.streak || 0,
    badges: s.badges || []
  }));
  await supabase.from('students').upsert(mapped);
};

export const recordAttendance = async (studentId: string, targetDate?: string, autoJoined: boolean = false) => {
  const now = new Date();
  const today = targetDate || now.toISOString().slice(0, 10);

  try {
    const { data: attData } = await supabase
      .from('attendance')
      .select('id')
      .eq('studentId', String(studentId))
      .eq('lessonDate', today)
      .maybeSingle();

    if (attData) return null;

    await supabase.from('attendance').insert({
      id: `${today}_${studentId}`,
      student_id: String(studentId),
      lesson_date: today,
      joined_at: new Date().toISOString(),
      auto_joined: autoJoined,
      xp_earned: 100
    });

    const { data: student } = await supabase
      .from('students')
      .select('xp, level, streak, "attendanceHistory"')
      .eq('id', String(studentId))
      .maybeSingle();

    if (!student) {
      await supabase.from('students').insert({
        id: String(studentId),
        xp: 100,
        level: 1,
        streak: 1,
        attendance_history: [today]
      });
      return { xpEarned: 100, streak: 1, streakBonus: false };
    }

    const currentXP = student.xp || 0;
    const history = student.attendance_history || [];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let newStreak = 1;
    let streakBonus = 0;
    if (history.includes(yesterdayStr)) {
      newStreak = (student.streak || 0) + 1;
      if (newStreak >= 2) streakBonus = 50;
    }

    const earnedXP = 100 + streakBonus;
    const nextXP = currentXP + earnedXP;
    const nextLevel = Math.floor(nextXP / 200) + 1;

    await supabase.from('students').update({
      xp: nextXP,
      level: nextLevel,
      streak: newStreak,
      attendance_history: [...history, today]
    }).eq('id', String(studentId));

    return { xpEarned: earnedXP, streak: newStreak, streakBonus: streakBonus > 0 };
  } catch (error) {
    console.error('XP Sync Error:', error);
    return null;
  }
};

export const getAttendanceForLesson = async (lessonDate: string) => {
  const { data } = await supabase.from('attendance').select('"studentId", "joinedAt", "autoJoined"').eq('lessonDate', lessonDate);
  return data || [];
};

export const getAllFeedback = async (): Promise<FeedbackEntry[]> => {
  const { data } = await supabase.from('feedback').select('*').order('"createdAt"', { ascending: false });
  return (data || []) as FeedbackEntry[];
};

export const updateNickname = async (studentId: string, nickname: string) => {
  await supabase.from('students').update({
    nickname,
    display_name: nickname
  }).eq('id', studentId);
};

export const getAgentData = async (id: string) => {
  const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
  if (error) return null;
  return data;
};

export const updateAgentXP = async (id: string, xp: number, level: number) => {
  await supabase.from('students').update({ xp, level }).eq('id', id);
};

export const updateDisplayName = async (id: string, displayName: string) => {
  await supabase.from('students').update({ display_name: displayName, nickname: displayName }).eq('id', id);
};

export const saveAdminPassword = async (hashedPassword: string) => {
  await supabase.from('settings').upsert({ id: 'admin_auth', data: { admin_hash: hashedPassword, updatedAt: Date.now() } });
};

interface AdminAuthData {
  admin_hash: string;
}

export const getAdminAuth = async (): Promise<AdminAuthData | null> => {
  const { data } = await supabase.from('settings').select('data').eq('id', 'admin_auth').maybeSingle();
  return data ? (data.data as AdminAuthData) : null;
};

export const getSettingStore = async <T>(id: string, defaultData: T): Promise<T> => {
  try {
    const { data, error } = await supabase.from('settings').select('data').eq('id', id).maybeSingle();
    if (error || !data) return defaultData;
    return (data.data as T) || defaultData;
  } catch {
    return defaultData;
  }
};

export const saveSettingStore = async <T>(id: string, dataObj: T): Promise<void> => {
  await supabase.from('settings').upsert({ id, data: dataObj as any }, { onConflict: 'id' });
};

export const subscribeToSettingStore = <T>(id: string, defaultData: T, callback: (data: T) => void) => {
  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('data').eq('id', id).maybeSingle();
    callback((data ? data.data : defaultData) as T);
  };
  fetchSettings();
  const channelName = `settings_${id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `id=eq.${id}` }, fetchSettings)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const checkAndAwardBadge = async (studentId: string, badgeKey: string) => {
  const { data } = await supabase
    .from('student_badges')
    .select('*')
    .eq('student_id', studentId)
    .eq('badge_key', badgeKey)
    .maybeSingle();

  if (!data) {
    await supabase.from('student_badges').insert([{
      student_id: studentId,
      badge_key: badgeKey,
      earned_at: new Date().toISOString()
    }]);
    return true;
  }
  return false;
};

export const getStudentBadges = async (studentId: string) => {
  const { data } = await supabase
    .from('student_badges')
    .select('*')
    .eq('student_id', studentId);
  return data || [];
};

