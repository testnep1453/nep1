import { useState, useEffect } from 'react';
import { Student } from '../types/student';
import { getStudents } from '../services/db'; 
import { getStudentById, upsertStudent, signOutUser, saveStudentEmail, signInAndMapStudent } from '../services/authService';
import { registerDevice } from '../services/deviceService';
import { supabase } from '../config/supabase';

const ADMIN_ID = '1002';

export const useAuth = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);
  const [needsAdminAuth, setNeedsAdminAuth] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [googleError, setGoogleError] = useState(''); 

  useEffect(() => {
    const initAuth = async () => {
      // 1. Google'dan siteye geri dönüşü yakala!
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        const email = session.user.email;
        // Supabase'de bu mailde bir öğrenci var mı bak
        const { data: matchedStudent } = await supabase.from('students').select('id').eq('email', email).single();
        
        if (matchedStudent) {
          // Öğrenci bulunduysa direkt içeri al
          localStorage.setItem('studentId', matchedStudent.id);
          sessionStorage.setItem('emailVerified', 'true');
          await loadStudent(matchedStudent.id, true);
          return;
        } else {
          // Bulunamadıysa oturumu kapat ve uyar
          await supabase.auth.signOut();
          setGoogleError('Önce numaranla giriş yap.');
        }
      }

      // 2. Normal giriş kontrolü
      const storedId = localStorage.getItem('studentId');
      const emailVerified = sessionStorage.getItem('emailVerified') === 'true';

      if (storedId) {
        loadStudent(storedId, emailVerified);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loadStudent = async (id: string, hasVerifiedEmail: boolean = false) => {
    setLoading(true);
    const jsonStudent = getStudents().find(s => s.id === id);
    if (!jsonStudent) {
      setLoading(false);
      return;
    }

    let studentData = await getStudentById(id);

    if (!studentData) {
      studentData = {
        id: jsonStudent.id, name: jsonStudent.name, nickname: jsonStudent.nickname, email: jsonStudent.email,
        xp: jsonStudent.xp || 0, level: jsonStudent.level || 1, badges: [],
        avatar: jsonStudent.avatar || 'hero_1', lastSeen: Date.now(), attendanceHistory: [], streak: 0,
      };
      await upsertStudent(studentData);
    }

    if (id !== ADMIN_ID && !hasVerifiedEmail) {
      setPendingStudent(studentData);
      setNeedsEmailVerification(true);
      setLoading(false);
      return;
    }

    try { await registerDevice(id); } catch {}
    await signInAndMapStudent(id);

    sessionStorage.setItem('emailVerified', 'true');
    setStudent(studentData);
    setLoading(false);
  };

  const login = async (studentId: string): Promise<boolean> => {
    setLoading(true);
    setGoogleError(''); // Hataları temizle
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

  // YENİ: Sadece Google'a yönlendirir, anında hata vermez!
  const loginWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    return true; 
  };

  const confirmEmailVerification = (email: string) => {
    if (pendingStudent) {
      const updated = { ...pendingStudent, email };
      sessionStorage.setItem('emailVerified', 'true');
      saveStudentEmail(updated.id, email); 
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
    window.location.reload();
  };

  return { student, loading, login, loginWithGoogle, logout, pendingStudent, needsAdminAuth, confirmAdminAuth, cancelAdminAuth, needsEmailVerification, confirmEmailVerification, googleError };
};
