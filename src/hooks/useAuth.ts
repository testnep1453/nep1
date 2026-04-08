import { useState, useEffect } from 'react';
import { Student } from '../types/student';
import { getStudents } from '../services/db'; // Yerel öğrenci listesi yedeği
import { getStudentById, upsertStudent, signOutUser, saveStudentEmail } from '../services/authService';
import { registerDevice } from '../services/deviceService';

const ADMIN_ID = '1002';

export const useAuth = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);
  const [needsAdminAuth, setNeedsAdminAuth] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem('studentId');
    const emailVerified = sessionStorage.getItem('emailVerified') === 'true';

    if (storedId) {
      loadStudent(storedId, emailVerified);
    } else {
      setLoading(false);
    }
  }, []);

  const loadStudent = async (id: string, hasVerifiedEmail: boolean = false) => {
    setLoading(true);
    
    // 1. Önce öğrencinin temel bilgilerini JSON'dan bul (İsim, XP vb.)
    const jsonStudent = getStudents().find(s => s.id === id);

    if (!jsonStudent) {
      setLoading(false);
      return;
    }

    // 2. Supabase'den öğrencinin en güncel halini (varsa) çek
    let studentData = await getStudentById(id);

    // 3. Eğer Supabase'de ilk kez giriyorsa (kayıt yoksa), hemen oluştur!
    if (!studentData) {
      studentData = {
        id: jsonStudent.id,
        name: jsonStudent.name,
        nickname: jsonStudent.nickname,
        email: jsonStudent.email,
        xp: jsonStudent.xp || 0,
        level: jsonStudent.level || 1,
        badges: [],
        avatar: jsonStudent.avatar || 'hero_1',
        lastSeen: Date.now(),
        attendanceHistory: [],
        streak: 0,
      };
      // Supabase'e kaydet
      await upsertStudent(studentData);
    }

    // 4. Admin ve E-posta Doğrulama Kontrolleri
    if (id !== ADMIN_ID && !hasVerifiedEmail) {
      setPendingStudent(studentData);
      setNeedsEmailVerification(true);
      setLoading(false);
      return;
    }

    // 5. Cihaz onayı vb. (Sessizce çalışır)
    try {
        await registerDevice(id);
    } catch {}

    // Her şey tamamsa içeri al
    sessionStorage.setItem('emailVerified', 'true');
    setStudent(studentData);
    setLoading(false);
  };

  const login = async (studentId: string): Promise<boolean> => {
    setLoading(true);
    if (studentId === ADMIN_ID) {
      const jsonStudent = getStudents().find(s => s.id === ADMIN_ID);
      if (jsonStudent) {
        setPendingStudent({
          id: jsonStudent.id, name: jsonStudent.name, nickname: jsonStudent.nickname, email: jsonStudent.email,
          xp: jsonStudent.xp || 0, level: jsonStudent.level || 1, badges: [],
          avatar: jsonStudent.avatar || 'hero_2', lastSeen: Date.now(), attendanceHistory: [], streak: 0,
        });
        setNeedsAdminAuth(true);
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    }

    const jsonStudent = getStudents().find(s => s.id === studentId);
    if (jsonStudent) {
      localStorage.setItem('studentId', studentId);
      await loadStudent(studentId);
      return true;
    }

    setLoading(false);
    return false;
  };

  const loginWithGoogle = async (studentId: string, email: string): Promise<boolean> => {
     const jsonStudent = getStudents().find(s => s.id === studentId);
     if (jsonStudent) {
       localStorage.setItem('studentId', studentId);
       sessionStorage.setItem('emailVerified', 'true');
       await saveStudentEmail(studentId, email); // Supabase'e güncel maili kaydet
       await loadStudent(studentId, true);
       return true;
     }
     return false;
  };

  const confirmEmailVerification = (email: string) => {
    if (pendingStudent) {
      const updated = { ...pendingStudent, email };
      sessionStorage.setItem('emailVerified', 'true');
      saveStudentEmail(updated.id, email); // Supabase'e güncel maili kaydet
      setStudent(updated);
      setPendingStudent(null);
      setNeedsEmailVerification(false);
    }
  };

  const confirmAdminAuth = () => {
    if (pendingStudent) {
      localStorage.setItem('studentId', pendingStudent.id);
      sessionStorage.setItem('emailVerified', 'true');
      setStudent(pendingStudent);
      setPendingStudent(null);
      setNeedsAdminAuth(false);
    }
  };

  const cancelAdminAuth = () => {
    setPendingStudent(null);
    setNeedsAdminAuth(false);
  };

  const logout = () => {
    setStudent(null);
    setPendingStudent(null);
    setNeedsEmailVerification(false);
    setNeedsAdminAuth(false);
    localStorage.removeItem('studentId');
    sessionStorage.removeItem('emailVerified');
    signOutUser();
  };

  return { student, loading, login, loginWithGoogle, logout, pendingStudent, needsAdminAuth, confirmAdminAuth, cancelAdminAuth, needsEmailVerification, confirmEmailVerification };
};
