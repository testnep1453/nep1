import { supabase } from '../config/supabase';
import { Student } from '../types/student';

export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    // Fetch base student data (now includes xp, level, display_name)
    const { data: student, error } = await supabase.from('students').select('*').eq('studentId', id).single();
    if (error || !student) return null;

    return {
      id: student.id,
      name: student.name,
      nickname: student.display_name || student.nickname || 'AJAN',
      email: student.email,
      xp: student.xp ?? 0,
      level: student.level ?? 1,
      badges: student.badges || [],
      avatar: student.avatar || 'hero_1',
      lastSeen: new Date(student.last_seen || Date.now()).getTime(),
      attendanceHistory: student.attendance_history || [],
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
      studentEmail: student.email,
      xp: student.xp,
      level: student.level,
      avatar: student.avatar,
      streak: student.streak,
      badges: student.badges,
      attendance_history: student.attendanceHistory || [],
      last_seen: new Date().toISOString()
    });
    return !error;
  } catch {
    return false;
  }
};

export const saveStudentEmail = async (studentId: string, email: string): Promise<void> => {
  await supabase.from('students').update({ studentEmail: email }).eq('studentId', studentId);
};

export const signOutUser = async () => {
  await supabase.auth.signOut();
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

// Köprü: useAuth hala bu fonksiyonu içe aktarıyor
export const signInAndMapStudent = async (studentId: string): Promise<any> => { return { uid: studentId }; };

export const saveStudentEmail = async (studentId: string, email: string) => {
  const { error } = await supabase
    .from('students')
    .update({ studentEmail: email })
    .eq('studentId', studentId);

  if (error) throw error;
};