import { supabase } from '../config/supabase';
import { Student } from '../types/student';

const ADMIN_STUDENT_ID = '1002';

export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
    if (error || !data) return null;
    return {
      id: data.id, name: data.name, nickname: data.nickname, email: data.email,
      xp: data.xp || 0, level: data.level || 1, badges: data.badges || [],
      avatar: data.avatar || 'hero_1', lastSeen: data.lastSeen || Date.now(),
      attendanceHistory: data.attendanceHistory || [], streak: data.streak || 0,
    };
  } catch {
    return null;
  }
};

export const upsertStudent = async (student: Student): Promise<boolean> => {
  try {
    const { error } = await supabase.from('students').upsert({
      id: student.id, name: student.name, nickname: student.nickname, email: student.email,
      xp: student.xp, level: student.level, avatar: student.avatar, streak: student.streak,
      badges: student.badges, attendanceHistory: student.attendanceHistory, lastSeen: Date.now()
    });
    return !error;
  } catch {
    return false;
  }
};

export const saveStudentEmail = async (studentId: string, email: string): Promise<void> => {
  await supabase.from('students').update({ email }).eq('id', studentId);
};

export const signOutUser = async () => {
  await supabase.auth.signOut();
};

export const signInWithGoogle = async (): Promise<{ email: string; user: any } | null> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) return null;
  return { email: '', user: data };
};

export const findStudentByEmail = async (email: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.from('students').select('id').eq('email', email).single();
    if (error || !data) return null;
    return data.id;
  } catch {
    return null;
  }
};

// ==========================================
// YENİ: 6 HANELİ KOD (OTP) SİSTEMİ
// ==========================================

export const sendVerificationCode = async (email: string): Promise<boolean> => {
  try {
    // Sadece mail gönderir (Supabase standart olarak 6 haneli kod yollar)
    const { error } = await supabase.auth.signInWithOtp({ email });
    return !error;
  } catch {
    return false;
  }
};

export const verifyEmailCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    return !error && !!data.user;
  } catch {
    return false;
  }
};

// Çökmeyi engelleyen köprüler
export const signInAndMapStudent = async (studentId: string): Promise<any> => { return { uid: studentId }; };
export const mapGoogleUserToStudent = async (user: any, studentId: string): Promise<void> => {};
export const handleEmailLinkVerification = async () => { return null; };
export const getStudentMapping = async (uid: string) => { return { studentId: uid, isAdmin: uid === ADMIN_STUDENT_ID }; };
export const getCurrentUser = (): any => { return null; };
export const sendVerificationLink = async () => { return false; };
