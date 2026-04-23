import { supabase } from '../config/supabase';
import { Student } from '../types/student';

export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    const { data: student, error } = await supabase.from('students').select('*').eq('id', id).single();
    if (error || !student) return null;
    return {
      id: student.id, name: student.name, nickname: student.displayName || student.nickname || 'AJAN',
      email: student.email, xp: student.xp ?? 0, level: student.level ?? 1, badges: student.badges || [],
      avatar: student.avatar || 'hero_1', lastSeen: new Date(student.lastSeen || Date.now()).getTime(),
      attendanceHistory: student.attendanceHistory || [], streak: student.streak ?? 0,
    };
  } catch { return null; }
};

export const upsertStudent = async (student: Student): Promise<boolean> => {
  try {
    const { error } = await supabase.from('students').upsert({
      "id": student.id, "name": student.name, "nickname": student.nickname, "displayName": student.nickname,
      "email": student.email, "xp": student.xp, "level": student.level, "avatar": student.avatar,
      "streak": student.streak, "badges": student.badges, "attendanceHistory": student.attendanceHistory || [],
      "lastSeen": new Date().toISOString()
    });
    return !error;
  } catch { return false; }
};

export const signInAndMapStudent = async (studentId: string): Promise<any> => { return { uid: studentId }; };

export const saveStudentEmail = async (studentId: string, email: string) => {
  const { error } = await supabase.from('students').update({ "email": email }).eq('id', studentId);
  if (error) throw error;
};

export const sendVerificationCode = async (email: string, isAdmin: boolean = false): Promise<{ success: boolean; message?: string }> => {
  try {
    // Admin için students tablosu kontrolü atlanır, direkt OTP gönderilir
    if (!isAdmin) {
      const { data: student } = await supabase.from('students').select('id').eq('email', email).maybeSingle();
      if (!student) return { success: false, message: 'Bu e-posta adresi sisteme kayıtlı değil!' };
    }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) return { success: false, message: 'Kod gönderilirken bir sorun oluştu.' };
    return { success: true };
  } catch { return { success: false, message: 'Bağlantı hatası!' }; }
};

export const verifyEmailCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    return !error && !!data.user;
  } catch { return false; }
};

export const notifyAdminSuspiciousActivity = async (email: string, reason: string): Promise<void> => {
  try {
    let ip = 'Bilinmiyor';
    try { const res = await fetch('https://api.ipify.org?format=json'); ip = (await res.json()).ip; } catch { }
    
    // YENİ: Supabase 400 hatasını önlemek için snake_case kullanıldı
    await supabase.from('security_alerts').insert({ 
      "email": email, 
      "ip_address": ip, 
      "reason": reason, 
      "user_agent": navigator.userAgent 
    });
  } catch { }
};

export const signOutUser = async () => { await supabase.auth.signOut(); };
