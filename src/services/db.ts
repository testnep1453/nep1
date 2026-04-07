import seedData from '../student_list.json';
import { Student } from '../types/student';

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

const XP_FOR_ATTENDANCE = 100;
const XP_FOR_STREAK_BONUS = 50;

export const recordAttendance = (studentId: string) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const students = getStudents();
  const idx = students.findIndex((s) => s.id === studentId);
  if (idx === -1) return;

  const student = students[idx];
  if (!student.attendanceHistory) student.attendanceHistory = [];

  // Bugün zaten kayıt var mı?
  const alreadyToday = student.attendanceHistory.some((r) => r.date === today);
  if (alreadyToday) return;

  // Streak hesapla
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const lastRecord = student.attendanceHistory.length > 0
    ? student.attendanceHistory[student.attendanceHistory.length - 1]
    : null;

  let newStreak = 1;
  let streakBonus = 0;
  if (lastRecord && lastRecord.date === yesterdayStr) {
    newStreak = (student.streak || 0) + 1;
    if (newStreak >= 2) {
      streakBonus = XP_FOR_STREAK_BONUS;
    }
  }

  const totalXp = XP_FOR_ATTENDANCE + streakBonus;
  student.attendanceHistory.push({ date: today, lessonDate: today, xpEarned: totalXp, joinedAt: Date.now(), autoJoined: false });
  student.streak = newStreak;
  student.xp = (student.xp || 0) + totalXp;
  student.level = Math.floor(student.xp / 200) + 1;

  // Rozet kontrolü
  if (!student.badges) student.badges = [];
  if (!student.badges.includes('first_login')) {
    student.badges.push('first_login');
  }
  if (newStreak >= 7 && !student.badges.includes('week_streak')) {
    student.badges.push('week_streak');
  }

  students[idx] = student;
  saveStudents(students);

  return { xpEarned: totalXp, streak: newStreak, streakBonus: streakBonus > 0 };
};
