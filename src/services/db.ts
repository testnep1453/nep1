import seedData from '../student_list.json';
import { Student } from '../types/student';

const initializeDb = () => {
  if (!localStorage.getItem('studentdb')) {
    localStorage.setItem('studentdb', JSON.stringify(seedData));
  }
  if (!localStorage.getItem('messagesdb')) {
    localStorage.setItem('messagesdb', JSON.stringify([{
      id: "demo-msg",
      text: "Sisteme operasyonel girişler sağlandı. Ajanların dikkatine!",
      date: Date.now()
    }]));
  }
};

export const getStudents = (): Student[] => {
  initializeDb();
  const data = localStorage.getItem('studentdb');
  return data ? JSON.parse(data) : [];
};

export const saveStudents = (students: Student[]) => {
  localStorage.setItem('studentdb', JSON.stringify(students));
};

export const addStudent = (student: Student) => {
  const students = getStudents();
  students.push(student);
  saveStudents(students);
};

export const updateStudent = (id: string, updates: Partial<Student>) => {
  const students = getStudents();
  const index = students.findIndex((s) => s.id === id);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates };
    saveStudents(students);
  }
};

export const removeStudent = (id: string) => {
  const students = getStudents();
  saveStudents(students.filter((s) => s.id !== id));
};

export interface AppMessage {
  id: string;
  text: string;
  date: number;
}

export const getMessages = (): AppMessage[] => {
  initializeDb();
  const data = localStorage.getItem('messagesdb');
  return data ? JSON.parse(data) : [];
};

export const addMessage = (text: string) => {
  const messages = getMessages();
  messages.unshift({ id: Date.now().toString(), text, date: Date.now() });
  localStorage.setItem('messagesdb', JSON.stringify(messages));
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
  student.attendanceHistory.push({ date: today, xpEarned: totalXp, videoWatched: false });
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
