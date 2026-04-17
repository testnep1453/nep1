import { supabase } from '../config/supabase';
import { Student } from '../types/student';

export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    const { data: student, error } = await supabase.from('students')
      .select('*')
      .eq('"id"', id)
      .single();
    if (error || !student) return null;

    return {
      id: student.id,
      name: student.name,
      nickname: student.displayName || student.nickname || 'AJAN',
      email: student.email,
      xp: student.xp ?? 0,
      level: student.level ?? 1,
      badges: student.badges || [],
      avatar: student.avatar || 'hero_1',
      lastSeen: new Date(student.lastSeen || Date.now()).getTime(),
      attendanceHistory: student.attendanceHistory || [],
      streak: student.streak ?? 0,
    };
  } catch {
    return null;
  }
};

export const upsertStudent = async (student: Student): Promise<boolean> => {
  try {
    const { error } = await supabase.from('students').upsert({
      "id": student.id,
      "name": student.name,
      "nickname": student.nickname,
      "displayName": student.nickname,
      "email": student.email,
      "xp": student.xp,
      "level": student.level,
      "avatar": student.avatar,
      "streak": student.streak,
      "badges": student.badges,
      "attendanceHistory": student.attendanceHistory || [],
      "lastSeen": new Date().toISOString()
    });
    return !error;
  } catch {
    return false;
  }
};

export const signOutUser = async () => {
  await supabase.auth.signOut();
};