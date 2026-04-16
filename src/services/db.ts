import seedData from '../student_list.json';
import { Student } from '../types/student';
import { supabase } from '../config/supabase';

// --- GÜVENLİK DÜZELTMESİ ---
// localStorage'a TÜM öğrenci listesi YAZILMAZ.
// Sadece son giriş yapan öğrencinin session ID'si ve tekil kayıt bilgisi tutulur.
// Öğrenci listesi sadece seedData'dan (readonly) okunur, localStorage'a kaydedilmez.
// Admin panelden yapılan değişiklikler sadece Firestore'a yazılır.

let cachedSeedData: Student[] | null = null;

const getCachedSeedData = (): Student[] => {
  if (!cachedSeedData) {
    cachedSeedData = seedData as Student[];
  }
  return cachedSeedData;
};

export const getStudents = (): Student[] => {
  return getCachedSeedData();
};

// Session yönetimi: sadece aktif öğrenci ID'si ve kendi verisi
export const saveSession = (studentId: string) => {
  localStorage.setItem('studentId', studentId);
};

export const saveStudents = (_students: Student[]) => {
  // Deprecated — Firestore kullanılmalı (sessiz)
};

export const addStudent = (_student: Student) => {
  // Deprecated — Firestore kullanılmalı (sessiz)
};

export const updateStudent = (_id: string, _updates: Partial<Student>) => {
  // Deprecated — Firestore kullanılmalı (sessiz)
};

export const removeStudent = (_id: string) => {
  // Deprecated — Firestore kullanılmalı (sessiz)
};

export interface AppMessage {
  id: string;
  text: string;
  date: number;
}

export const getMessages = (): AppMessage[] => {
  return [];
};

export const addMessage = (_text: string) => {
  // Deprecated — Firestore kullanılmalı (sessiz)
};

// --- KATILIM + OTOMATİK XP + STREAK ---

export const recordAttendance = async (studentId: string) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  
  try {
    // 1. Check if already attended today (attendance table - snake_case)
    const { data: attData } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', String(studentId))
      .eq('lesson_date', today)
      .maybeSingle();

    if (attData) return; // Already recorded

    // 2. record attendance
    await supabase.from('attendance').insert({
      id: `${today}_${studentId}`, 
      student_id: String(studentId), 
      lesson_date: today, 
      joined_at: new Date().toISOString(), 
      auto_joined: false, 
      xp_earned: 100
    });

    // 3. Get current student data (snake_case)
    const { data: student } = await supabase
      .from('students')
      .select('xp, level, streak, attendance_history')
      .eq('id', String(studentId))
      .maybeSingle();

    if (!student) {
      // Create student entry if not exists
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
    
    // Streak logic
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

    // 4. Update students table immediately
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
