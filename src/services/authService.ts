import { supabase } from '../config/supabase';
import { Student } from '../types/student';

const ADMIN_STUDENT_ID = '1002';

// ==========================================
// 1. SUPABASE ANA FONKSİYONLARI
// ==========================================

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

// ==========================================
// 2. ÇÖKMEYİ ENGELLEYEN KÖPRÜLER (HATA İMHA EDİCİLER)
// ==========================================

export const signInAndMapStudent = async (studentId: string): Promise<any> => {
  return { uid: studentId }; // Eski arayüzler hata vermesin diye eklendi
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

export const mapGoogleUserToStudent = async (user: any, studentId: string): Promise<void> => {};

export const sendVerificationLink = async (email: string, studentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: `${window.location.origin}/?studentId=${studentId}&mode=emailVerify` }
    });
    if (error) throw error;
    localStorage.setItem('emailForVerification', email);
    localStorage.setItem('pendingVerifyStudentId', studentId);
    return true;
  } catch {
    return false;
  }
};

export const handleEmailLinkVerification = async (): Promise<{ email: string; studentId: string } | null> => {
  const email = localStorage.getItem('emailForVerification');
  const studentId = localStorage.getItem('pendingVerifyStudentId');
  if (!email || !studentId) return null;
  localStorage.removeItem('emailForVerification');
  localStorage.removeItem('pendingVerifyStudentId');
  return { email, studentId };
};

export const getStudentMapping = async (uid: string): Promise<{ studentId: string; isAdmin: boolean } | null> => {
  return { studentId: uid, isAdmin: uid === ADMIN_STUDENT_ID };
};

export const getCurrentUser = (): any => {
  return null;
};
