import { useState, useEffect } from 'react';
import { Student } from '../types/student';
import { getStudents } from '../services/clientStorageService'; 
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
  const [googleError, setGoogleError] = useState<string>(() => {
    const stored = sessionStorage.getItem('oauthError');
    if (stored) {
      sessionStorage.removeItem('oauthError');
      return stored;
    }
    return '';
  });

  useEffect(() => {
    const initAuth = async () => {
      // 1. Google'dan siteye geri dönüşü yakala!
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        const email = session.user.email;

        // 1. E-posta doğrulama kontrolü
        const emailConfirmedAt = session.user.email_confirmed_at;
        if (!emailConfirmedAt) {
          await supabase.auth.signOut();
          sessionStorage.setItem('oauthError', 'E-posta adresiniz henüz doğrulanmamış. Lütfen giriş yapmadan önce e-posta adresinizi doğrulayın.');
          setGoogleError('E-posta adresiniz henüz doğrulanmamış. Lütfen giriş yapmadan önce e-posta adresinizi doğrulayın.');
          setLoading(false);
          return;
        }

        // 2. Supabase'de bu mailde bir öğrenci var mı bak
        const { data: matchedStudent } = await supabase.from('students').select('id').eq('email', email).maybeSingle();
        
        if (matchedStudent) {
          // Öğrenci bulunduysa direkt içeri al
          localStorage.setItem('studentId', matchedStudent.id);
          sessionStorage.setItem('emailVerified', 'true');
          await loadStudent(matchedStudent.id, true);
          return;
        } else {
          // Bulunamadıysa oturumu kapat ve uyar
          await supabase.auth.signOut();
          sessionStorage.setItem('oauthError', 'Bu Google hesabı sisteme kayıtlı değil. Önce numaranla giriş yaparak e-postanı bağla.');
          setGoogleError('Bu Google hesabı sisteme kayıtlı değil. Önce numaranla giriş yaparak e-postanı bağla.');
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

  // Güvenli env erişimi
const getBaseUrl = (): string => {
  try {
    const base = import.meta.env.BASE_URL;
    return typeof base === 'string' ? base : '/';
  } catch {
    return '/';
  }
};

// YENİ: Sadece Google'a yönlendirir, anında hata vermez!
const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        // GitHub Pages alt klasör yapısı (/nep1/) ve localhost için kurşungeçirmez yönlendirme
        redirectTo: window.location.origin + getBaseUrl() 
      }
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

  // E-posta doğrulama ekranından ID giriş ekranına güvenli geri dönüş
  // logout()'un aksine window.location.reload() ÇAĞIRMAZ — sadece state'i temizler
  const cancelEmailVerification = () => {
    setPendingStudent(null);
    setNeedsEmailVerification(false);
    localStorage.removeItem('studentId');
    sessionStorage.removeItem('emailVerified');
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

  return { student, loading, login, loginWithGoogle, logout, pendingStudent, needsAdminAuth, confirmAdminAuth, cancelAdminAuth, needsEmailVerification, confirmEmailVerification, cancelEmailVerification, googleError };
};

