import { supabase } from '../config/supabase';
import { Student } from '../types/student';

const ADMIN_STUDENT_ID = import.meta.env.VITE_ADMIN_ID || '';

export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    // Fetch base student data (now includes xp, level, display_name)
    const { data: student, error } = await supabase.from('students').select('*').eq('id', id).single();
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
      id: student.id, 
      name: student.name, 
      nickname: student.nickname, 
      email: student.email,
      xp: student.xp, 
      level: student.level, 
      avatar: student.avatar, 
      streak: student.streak,
      badges: student.badges, 
      attendanceHistory: student.attendanceHistory || [], 
      lastSeen: new Date().toISOString()
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
    const { data, error } = await supabase.from('students').select('id').eq('email', email).maybeSingle();
    if (error || !data) return null;
    return data.id;
  } catch {
    return null;
  }
};

// ==========================================
// OTP VE GÜVENLİK
// ==========================================

export const sendVerificationCode = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data: student, error: dbError } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (dbError || !student) {
      return { success: false, message: 'Bu e-posta adresi sisteme kayıtlı değil!' };
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    
    if (error) {
      return { success: false, message: 'Kod gönderilirken bir sorun oluştu.' };
    }

    return { success: true };
  } catch {
    return { success: false, message: 'Beklenmeyen bir bağlantı hatası oluştu.' };
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

export const notifyAdminSuspiciousActivity = async (email: string, reason: string): Promise<void> => {
  try {
    let ip = 'Bilinmiyor';
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch {
      console.warn("IP alınamadı, bildirime devam ediliyor.");
    }

    await supabase.from('security_alerts').insert({
      email: email,
      ipAddress: ip,
      reason: reason,
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.error('Güvenlik uyarısı kaydedilemedi:', error);
  }
};

export const deleteSecurityAlert = async (alertId: string) => {
  const { error } = await supabase.from('security_alerts').delete().eq('id', alertId);
  return !error;
};

// Çökmeyi engelleyen köprüler
export const signInAndMapStudent = async (studentId: string): Promise<any> => { return { uid: studentId }; };
export const mapGoogleUserToStudent = async (user: any, studentId: string): Promise<void> => {};
export const handleEmailLinkVerification = async () => { return null; };
export const getStudentMapping = async (uid: string) => { return { studentId: uid, isAdmin: uid === ADMIN_STUDENT_ID }; };
export const getCurrentUser = (): any => { return null; };
export const sendVerificationLink = async () => { return false; };

