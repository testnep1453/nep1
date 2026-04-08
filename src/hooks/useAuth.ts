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
    const emailVerified = sessionStorage.getItem('emailVerified') === 'true';

    if (storedId) {
      loadStudent(storedId, emailVerified);
    } else {
      setLoading(false);
    }
  }, []);

  const loadStudent = async (id: string, hasVerifiedEmail: boolean = false) => {
    const jsonStudent = getStudents().find(s => s.id === id);
    
    // Eğer yerel JSON'da varsa HIZLICA devam et
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

      if (id !== ADMIN_ID && !hasVerifiedEmail) {
        setPendingStudent(studentData);
        setNeedsEmailVerification(true);
        setLoading(false);
        return;
      }

      try {
        const deviceResult = await registerDevice(id);
        if (deviceResult.needsApproval) {
          setPendingStudent(studentData);
          setNeedsDeviceApproval(true);
          setLoading(false);
          return;
        }
      } catch {
        // Cihaz hatasını yoksay, girişi engelleme
      }

      sessionStorage.setItem('emailVerified', 'true');
      setStudent(studentData);
      
      // Firestore hatası tüm uygulamayı dondurmasın diye arka planda (sessiz) çağır
      signInAndMapStudent(studentData.id).catch(() => console.warn("Firestore oturumu atlandı (API hatası)."));
      setLoading(false);
      return;
    }

    // Eğer Firebase'de aranacaksa, maksimum 3 saniye süre ver!
    try {
      const docRef = doc(db, 'students', id);
      // Promise.race ile Timeout mekanizması ekliyoruz
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore bağlantı zaman aşımı")), 3000))
      ]) as any;

      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        const studentData: Student = {
          id, name: data.name, nickname: data.nickname, email: data.email,
          xp: data.xp || 0, level: data.level || 1, badges: data.badges || [],
          avatar: data.avatar || 'hero_1', lastSeen: data.lastSeen?.toMillis?.() || data.lastSeen || Date.now(),
          attendanceHistory: data.attendanceHistory || [], streak: data.streak || 0,
        };

        if (id !== ADMIN_ID && !hasVerifiedEmail) {
          setPendingStudent(studentData);
          setNeedsEmailVerification(true);
          setLoading(false);
          return;
        }

        try {
          const deviceResult = await registerDevice(id);
          if (deviceResult.needsApproval) {
            setPendingStudent(studentData);
            setNeedsDeviceApproval(true);
            setLoading(false);
            return;
          }
        } catch {}

        sessionStorage.setItem('emailVerified', 'true');
        setStudent(studentData);
        signInAndMapStudent(studentData.id).catch(() => {});
      } else {
        localStorage.removeItem('studentId');
        sessionStorage.removeItem('emailVerified');
      }
    } catch (e) {
      console.warn("Firestore çevrimdışı, login iptal edildi: ", e);
      localStorage.removeItem('studentId');
      sessionStorage.removeItem('emailVerified');
    } finally {
      setLoading(false); // Her durumda Yükleniyor ekranını kapa
    }
  };

  const login = async (studentId: string): Promise<boolean> => {
    setLoading(true); // Tıklandığında yükleniyor göster
    if (studentId === ADMIN_ID) {
      const jsonStudent = getStudents().find(s => s.id === ADMIN_ID);
      if (jsonStudent) {
        setPendingStudent({
           id: jsonStudent.id, name: jsonStudent.name, nickname: jsonStudent.nickname, 
           xp: jsonStudent.xp || 0, level: jsonStudent.level || 1, badges: [], 
           avatar: jsonStudent.avatar || 'hero_2', lastSeen: Date.now(), attendanceHistory: [], 
           streak: 0, email: jsonStudent.email 
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
      const studentData = {
        id: jsonStudent.id, name: jsonStudent.name, nickname: jsonStudent.nickname, email,
        xp: jsonStudent.xp || 0, level: jsonStudent.level || 1, badges: [],
        avatar: jsonStudent.avatar || 'hero_1', lastSeen: Date.now(), attendanceHistory: [], streak: 0,
      };
      localStorage.setItem('studentId', studentId);
      sessionStorage.setItem('emailVerified', 'true');
      setStudent(studentData);
      signInAndMapStudent(studentId).catch(() => {});
      return true;
    }
    return false;
  };

  const confirmEmailVerification = (email: string) => {
    if (pendingStudent) {
      const updated = { ...pendingStudent, email };
      sessionStorage.setItem('emailVerified', 'true');
      setStudent(updated);
      signInAndMapStudent(updated.id).catch(() => {});
      setPendingStudent(null);
      setNeedsEmailVerification(false);
    }
  };

  const confirmAdminAuth = () => {
    if (pendingStudent) {
      localStorage.setItem('studentId', pendingStudent.id);
      sessionStorage.setItem('emailVerified', 'true');
      setStudent(pendingStudent);
      signInAndMapStudent(pendingStudent.id).catch(() => {});
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
    signOutUser().catch(() => {});
  };

  return { student, loading, login, loginWithGoogle, logout, pendingStudent, needsDeviceApproval, needsAdminAuth, confirmAdminAuth, cancelAdminAuth, needsEmailVerification, confirmEmailVerification };
};
