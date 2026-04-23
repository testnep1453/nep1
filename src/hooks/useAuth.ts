import { useState, useEffect } from 'react';
import { Student } from '../types/student';
import { getStudents } from '../services/clientStorageService'; 
import { getStudentById, upsertStudent, signOutUser, saveStudentEmail, signInAndMapStudent } from '../services/authService';
import { registerDevice } from '../services/deviceService';
import { supabase } from '../config/supabase';
import { loginRateLimiter, sanitizeInput, securityLog } from '../utils/security';
import { validateAdminSession } from '../services/adminSessionService';

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

      if (session && window.location.hash.includes('access_token')) {
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', cleanUrl);
      }

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
          if (matchedStudent.id === ADMIN_ID) {
            // Admin Google login: email doğrulandı, parola+TOTP gerekli
            const jsonStudent = getStudents().find(s => s.id === ADMIN_ID);
            if (jsonStudent) {
              setPendingStudent({
                id: jsonStudent.id, name: jsonStudent.name, nickname: jsonStudent.nickname, email,
                xp: jsonStudent.xp || 0, level: jsonStudent.level || 1, badges: [],
                avatar: jsonStudent.avatar || 'hero_2', lastSeen: Date.now(), attendanceHistory: [], streak: 0,
              });
              setNeedsAdminAuth(true);
            }
            setLoading(false);
            return;
          }
          // Normal öğrenci: direkt içeri al
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

    // Step 1: Attempt to get existing data from Supabase first
    let studentData = await getStudentById(id);

    // Step 2: Determine Source
    const jsonStudent = getStudents().find(s => s.id === id);

    // GÜVENLİK: Admin sayfa yenilemelerinde aktif oturum token'ı kontrolü
    // Eğer başka cihaz login olduysa bu cihazın tokeni geçersiz olur → login ekranına git
    if (id === ADMIN_ID) {
      if (!jsonStudent) { setLoading(false); return; }
      const valid = await validateAdminSession();
      if (!valid) {
        localStorage.removeItem('studentId');
        localStorage.removeItem('admin_session_token');
        sessionStorage.removeItem('emailVerified');
        setLoading(false);
        return;
      }
    }

    // Step 3: If student doesn't exist in Supabase, seed it properly
    if (!studentData) {
      if (jsonStudent) {
        // Source is JSON (1001-1003)
        studentData = {
          id: jsonStudent.id, name: jsonStudent.name, nickname: jsonStudent.nickname, email: jsonStudent.email,
          xp: jsonStudent.xp || 0, level: jsonStudent.level || 1, badges: [],
          avatar: jsonStudent.avatar || 'hero_1', lastSeen: Date.now(), attendanceHistory: [], streak: 0,
        };
      } else {
        // Source is Supabase-only (1005+)
        const { data: sbStudent, error } = await supabase.from('students').select('*').eq('id', id).maybeSingle();
        if (error || !sbStudent) {
          localStorage.removeItem('studentId');
          setLoading(false);
          return;
        }
        studentData = {
          id: sbStudent.id, name: sbStudent.name, nickname: sbStudent.nickname || sbStudent.displayName || 'AJAN',
          email: sbStudent.email || '', xp: sbStudent.xp || 0, level: sbStudent.level || 1,
          badges: sbStudent.badges || [], avatar: sbStudent.avatar || 'hero_1',
          lastSeen: Date.now(), attendanceHistory: [], streak: 0,
        };
      }
      await upsertStudent(studentData);
    }

    // BUG FIX: E-postası Supabase'de kayıtlıysa doğrulama modalını atla
    if (id !== ADMIN_ID && !hasVerifiedEmail && studentData.email) {
      hasVerifiedEmail = true;
      sessionStorage.setItem('emailVerified', 'true');
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
    // Rate limiting check
    if (!loginRateLimiter.canProceed(studentId)) {
      securityLog('RATE_LIMIT_EXCEEDED', { studentId });
      alert('Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.');
      return false;
    }

    // Validate and sanitize input
    const cleanId = sanitizeInput(studentId);
    if (!/^\d{3,4}$/.test(cleanId)) {
      securityLog('INVALID_LOGIN_ATTEMPT', { attemptedId: cleanId });
      return false;
    }

    setLoading(true);
    setGoogleError('');
    loginRateLimiter.recordAttempt(cleanId);

    if (cleanId === ADMIN_ID) {
      const jsonStudent = getStudents().find(s => s.id === ADMIN_ID);
      if (jsonStudent) {
        setPendingStudent({
          id: jsonStudent.id, name: jsonStudent.name, nickname: jsonStudent.nickname, email: jsonStudent.email,
          xp: jsonStudent.xp || 0, level: jsonStudent.level || 1, badges: [],
          avatar: jsonStudent.avatar || 'hero_2', lastSeen: Date.now(), attendanceHistory: [], streak: 0,
        });
        // Admin de ajanlar gibi önce e-posta doğrulama, sonra parola+TOTP
        setNeedsEmailVerification(true);
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    }

    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('id, name, nickname, email')
        .eq('id', cleanId)
        .maybeSingle();

      if (error || !student) {
        setLoading(false);
        return false;
      }

      localStorage.setItem('studentId', cleanId);
      // BUG FIX: E-posta kayıtlıysa doğrulama adımını geç → direkt içeri al
      const alreadyHasEmail = !!(student.email && student.email.trim());
      if (alreadyHasEmail) {
        sessionStorage.setItem('emailVerified', 'true');
      }
      await loadStudent(cleanId, alreadyHasEmail);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      return false;
    }
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

  const confirmEmailVerification = async (email: string) => {
    if (pendingStudent) {
      const updated = { ...pendingStudent, email };
      sessionStorage.setItem('emailVerified', 'true');
      saveStudentEmail(updated.id, email);

      if (updated.id === ADMIN_ID) {
        // Admin: e-posta doğrulandı, şimdi parola + TOTP adımına geç
        setPendingStudent(updated);
        setNeedsEmailVerification(false);
        setNeedsAdminAuth(true);
      } else {
        // BUG FIX: Cihaz kaydı ve oturum oluşturma yapılıyordu, şimdi de yapılıyor
        try { await registerDevice(updated.id); } catch {}
        await signInAndMapStudent(updated.id);
        setStudent(updated);
        setPendingStudent(null);
        setNeedsEmailVerification(false);
      }
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
    localStorage.removeItem('admin_session_token');
    sessionStorage.removeItem('emailVerified');
    signOutUser();
    window.location.reload();
  };

  return { student, loading, login, loginWithGoogle, logout, pendingStudent, needsAdminAuth, confirmAdminAuth, cancelAdminAuth, needsEmailVerification, confirmEmailVerification, cancelEmailVerification, googleError };
};

