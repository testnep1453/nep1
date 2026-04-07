import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student } from '../types/student';
import { getStudents } from '../services/db';
import { registerDevice } from '../services/deviceService';
import { signInAndMapStudent, signOutUser } from '../services/authService';

const ADMIN_ID = '1002';

export const useAuth = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);
  const [needsDeviceApproval, setNeedsDeviceApproval] = useState(false);
  const [needsAdminAuth, setNeedsAdminAuth] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem('studentId');
    const emailVerified = localStorage.getItem('emailVerified') === 'true';

    if (storedId) {
      loadStudent(storedId, emailVerified);
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Öğrenci yükleme — Kimlik doğrulama kaldırıldı (Modül 1.1)
   * Doğrudan e-posta kontrolüne gider
   */
  const loadStudent = async (id: string, hasVerifiedEmail: boolean = false) => {
    // ÖNCE LOCALDAN ARA
    const jsonStudent = getStudents().find(s => s.id === id);
    if (jsonStudent) {
      const studentData: Student = {
        id: jsonStudent.id,
        name: jsonStudent.name,
        nickname: jsonStudent.nickname,
        xp: jsonStudent.xp || 0,
        level: jsonStudent.level || 1,
        badges: [],
        avatar: jsonStudent.avatar || 'hero_1',
        lastSeen: Date.now(),
        attendanceHistory: [],
        streak: 0,
        email: jsonStudent.email,
      };

      // Admin e-posta doğrulamayı atlar, diğerleri HER GİRİŞTE doğrulama yapar
      // (Google ile giriş hariç — o zaten loginWithGoogle'dan geçer)
      if (id !== ADMIN_ID && !hasVerifiedEmail) {
        setPendingStudent(studentData);
        setNeedsEmailVerification(true);
        setLoading(false);
        return;
      }

      // Cihaz kaydı
      try {
        const deviceResult = await registerDevice(id);
        if (deviceResult.needsApproval) {
          setPendingStudent(studentData);
          setNeedsDeviceApproval(true);
          setLoading(false);
          return;
        }
      } catch {
        // Cihaz kaydı hatasında yine de giriş yap
      }

      localStorage.setItem('emailVerified', 'true');
      setStudent(studentData);
      signInAndMapStudent(studentData.id).catch(() => {});
      setLoading(false);
      return;
    }

    // FIRESTORE
    try {
      const docRef = doc(db, 'students', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const studentData: Student = {
          id,
          name: data.name,
          nickname: data.nickname,
          email: data.email,
          xp: data.xp || 0,
          level: data.level || 1,
          badges: data.badges || [],
          avatar: data.avatar || 'hero_1',
          lastSeen: data.lastSeen?.toMillis?.() || data.lastSeen || Date.now(),
          attendanceHistory: data.attendanceHistory || [],
          streak: data.streak || 0,
        };

        // Google ile giriş yapılmadıysa HER ZAMAN doğrulama iste
        if (id !== ADMIN_ID && !hasVerifiedEmail) {
          setPendingStudent(studentData);
          setNeedsEmailVerification(true);
          setLoading(false);
          return;
        }

        // Cihaz kaydı
        try {
          const deviceResult = await registerDevice(id);
          if (deviceResult.needsApproval) {
            setPendingStudent(studentData);
            setNeedsDeviceApproval(true);
            setLoading(false);
            return;
          }
        } catch {
          // Hata durumunda girişe izin ver
        }

        localStorage.setItem('emailVerified', 'true');
        setStudent(studentData);
        signInAndMapStudent(studentData.id).catch(() => {});
      } else {
        localStorage.removeItem('studentId');
        localStorage.removeItem('emailVerified');
      }
    } catch {
      // Firestore devre dışı
    } finally {
      setLoading(false);
    }
  };

  const login = async (studentId: string): Promise<boolean> => {
    // Admin kontrolü
    if (studentId === ADMIN_ID) {
      const jsonStudent = getStudents().find(s => s.id === ADMIN_ID);
      if (jsonStudent) {
        setPendingStudent({
          id: jsonStudent.id,
          name: jsonStudent.name,
          nickname: jsonStudent.nickname,
          xp: jsonStudent.xp || 0,
          level: jsonStudent.level || 1,
          badges: [],
          avatar: jsonStudent.avatar || 'hero_2',
          lastSeen: Date.now(),
          attendanceHistory: [],
          streak: 0,
          email: jsonStudent.email,
        });
        setNeedsAdminAuth(true);
        return true;
      }

      try {
        const docRef = doc(db, 'students', ADMIN_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPendingStudent({
            id: ADMIN_ID,
            name: data.name || 'Admin',
            nickname: data.nickname,
            email: data.email,
            xp: data.xp || 0,
            level: data.level || 1,
            badges: data.badges || [],
            avatar: data.avatar || 'hero_2',
            lastSeen: Date.now(),
            attendanceHistory: [],
            streak: 0,
          });
          setNeedsAdminAuth(true);
          return true;
        }
      } catch {
        // Firestore erişimi yok
      }
      return false;
    }

    // Normal öğrenci girişi — Kimlik doğrulama kaldırıldı
    // Doğrudan loadStudent çağrılır, e-posta yoksa modal açılır
    const jsonStudent = getStudents().find(s => s.id === studentId);
    if (jsonStudent) {
      localStorage.setItem('studentId', studentId);
      await loadStudent(studentId);
      return true;
    }

    try {
      const docRef = doc(db, 'students', studentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        localStorage.setItem('studentId', studentId);
        await loadStudent(studentId);
        return true;
      }
    } catch {
      // Firestore devre dışı
    }

    return false;
  };

  // Google ile giriş — kimlik + e-posta doğrulamayı atla
  const loginWithGoogle = async (studentId: string, email: string): Promise<boolean> => {
    const jsonStudent = getStudents().find(s => s.id === studentId);
    let studentData: Student | null = null;

    if (jsonStudent) {
      studentData = {
        id: jsonStudent.id,
        name: jsonStudent.name,
        nickname: jsonStudent.nickname,
        email,
        xp: jsonStudent.xp || 0,
        level: jsonStudent.level || 1,
        badges: [],
        avatar: jsonStudent.avatar || 'hero_1',
        lastSeen: Date.now(),
        attendanceHistory: [],
        streak: 0,
      };
    } else {
      try {
        const docRef = doc(db, 'students', studentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          studentData = {
            id: studentId,
            name: data.name,
            nickname: data.nickname,
            email,
            xp: data.xp || 0,
            level: data.level || 1,
            badges: data.badges || [],
            avatar: data.avatar || 'hero_1',
            lastSeen: data.lastSeen?.toMillis?.() || data.lastSeen || Date.now(),
            attendanceHistory: data.attendanceHistory || [],
            streak: data.streak || 0,
          };
        }
      } catch {
        // Firestore erişimi yok
      }
    }

    if (!studentData) return false;

    localStorage.setItem('studentId', studentId);
    localStorage.setItem('emailVerified', 'true');
    setStudent(studentData);
    signInAndMapStudent(studentId).catch(() => {});
    return true;
  };

  // E-posta doğrulama tamamlandı
  const confirmEmailVerification = (email: string) => {
    if (pendingStudent) {
      const updated = { ...pendingStudent, email };
      localStorage.setItem('emailVerified', 'true');
      setStudent(updated);
      signInAndMapStudent(updated.id).catch(() => {});
      setPendingStudent(null);
      setNeedsEmailVerification(false);
    }
  };

  // Admin giriş başarılı
  const confirmAdminAuth = () => {
    if (pendingStudent) {
      localStorage.setItem('studentId', pendingStudent.id);
      localStorage.setItem('emailVerified', 'true');
      setStudent(pendingStudent);
      signInAndMapStudent(pendingStudent.id).catch(() => {});
      setPendingStudent(null);
      setNeedsAdminAuth(false);
    }
  };

  // Admin giriş iptal
  const cancelAdminAuth = () => {
    setPendingStudent(null);
    setNeedsAdminAuth(false);
  };

  // Çıkış
  const logout = () => {
    setStudent(null);
    setPendingStudent(null);
    setNeedsEmailVerification(false);
    setNeedsAdminAuth(false);
    localStorage.removeItem('studentId');
    localStorage.removeItem('emailVerified');
    signOutUser().catch(() => {});
  };

  return {
    student,
    loading,
    login,
    loginWithGoogle,
    logout,
    pendingStudent,
    needsDeviceApproval,
    needsAdminAuth,
    confirmAdminAuth,
    cancelAdminAuth,
    needsEmailVerification,
    confirmEmailVerification,
  };
};
