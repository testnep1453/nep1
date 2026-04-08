import { supabase } from '../config/supabase';
import { Student } from '../types/student';

// ============================================
// 1. ÖĞRENCİ VERİTABANI İŞLEMLERİ
// ============================================

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
  } catch (err) {
    console.error('Supabase öğrenci çekme hatası:', err);
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
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase öğrenci kaydetme hatası:', err);
    return false;
  }
};

export const saveStudentEmail = async (studentId: string, email: string): Promise<void> => {
  await supabase.from('students').update({ email }).eq('id', studentId);
};

// ============================================
// 2. GOOGLE SIGN-IN (Tek Satırda!)
// ============================================

export const signInWithGoogle = async () => {
  try {
    // Supabase arka planda popup açıp, hesabı bağlayıp bize geri döner
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Google giriş hatası:', err);
    return null;
  }
};

// ============================================
// 3. E-POSTA DOĞRULAMA (Magic Link / OTP)
// ============================================

export const sendVerificationLink = async (email: string): Promise<boolean> => {
  try {
    // Firebase'deki o actionCodeSettings, localStorage cart curt yok. Sadece bu:
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Mail gönderme hatası:', err);
    return false;
  }
};

// ============================================
// 4. OTURUM (SESSION) VE ÇIKIŞ İŞLEMLERİ
// ============================================

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const signOutUser = async () => {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Çıkış hatası:', err);
  }
};
