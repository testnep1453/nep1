import { supabase } from '../config/supabase';
import { Student } from '../types/student';

/**
 * Öğrenci verisini ID ile çeker (Strict camelCase & Quoted)
 */
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

/**
 * Öğrenci verisini günceller veya oluşturur
 */
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

/**
 * useAuth için gerekli köprü fonksiyonu
 */
export const signInAndMapStudent = async (studentId: string): Promise<any> => { 
  return { uid: studentId }; 
};

/**
 * Öğrenci e-postasını kaydeder
 */
export const saveStudentEmail = async (studentId: string, email: string) => {
  const { error } = await supabase
    .from('students')
    .update({ "email": email })
    .eq('"id"', studentId);
  if (error) throw error;
};

// ==========================================
// OTP VE GÜVENLİK
// ==========================================

/**
 * Giriş için OTP kodu gönderir
 */
export const sendVerificationCode = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data: student, error: dbError } = await supabase
      .from('students')
      .select('"id"')
      .eq('"email"', email)
      .maybeSingle();

    if (dbError || !student) {
      return { success: false, message: 'Bu e-posta adresi sisteme kayıtlı değil!' };
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return { success: false, message: 'Kod gönderilirken bir sorun oluştu.' };

    return { success: true };
  } catch {
    return { success: false, message: 'Beklenmeyen bir bağlantı hatası oluştu.' };
  }
};

/**
 * OTP kodunu doğrular
 */
export const verifyEmailCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    return !error && !!data.user;
  } catch {
    return false;
  }
};

/**
 * KRİTİK: AdminAuth.tsx tarafından beklenen eksik export
 */
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
      "email": email,
      "ipAddress": ip,
      "reason": reason,
      "userAgent": navigator.userAgent
    });
  } catch (error) {
    console.error('Güvenlik uyarısı kaydedilemedi:', error);
  }
};

/**
 * Çıkış işlemi
 */
export const signOutUser = async () => {
  await supabase.auth.signOut();
};
