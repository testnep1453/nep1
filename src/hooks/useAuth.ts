import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student } from '../types/student';
import { getStudents } from '../services/db';
import { registerDevice } from '../services/deviceService';

export const useAuth = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [needsDeviceApproval, setNeedsDeviceApproval] = useState(false);
  const [needsAdminAuth, setNeedsAdminAuth] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem('studentId');
    if (storedId) {
      loadStudent(storedId, true); // auto-login, isim doğrulama atla
    } else {
      setLoading(false);
    }
  }, []);

  const loadStudent = async (id: string, skipConfirmation: boolean = false) => {
    // ÖNCE LOCALDAN (DB SIMULATOR) ARA
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
      };

      if (!skipConfirmation) {
        // İsim doğrulama adımı
        setPendingStudent(studentData);
        setNeedsConfirmation(true);
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

      setStudent(studentData);
      setLoading(false);
      return;
    }

    // BULAMAZSA FIRESTORE'A BAK
    try {
      const docRef = doc(db, 'students', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const studentData: Student = {
          id,
          name: data.name,
          nickname: data.nickname,
          xp: data.xp || 0,
          level: data.level || 1,
          badges: data.badges || [],
          avatar: data.avatar || 'hero_1',
          lastSeen: data.lastSeen?.toMillis?.() || data.lastSeen || Date.now(),
          attendanceHistory: data.attendanceHistory || [],
          streak: data.streak || 0,
        };

        if (!skipConfirmation) {
          setPendingStudent(studentData);
          setNeedsConfirmation(true);
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

        setStudent(studentData);
      } else {
        localStorage.removeItem('studentId');
      }
    } catch (error) {
      console.warn('Firestore devre dışı, JSON kullanılıyor');
    } finally {
      setLoading(false);
    }
  };

  const login = async (studentId: string): Promise<boolean> => {
    // Admin kontrolü
    if (studentId === '1002') {
      // Admin için özel giriş akışı
      const jsonStudent = getStudents().find(s => s.id === '1002');
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
        });
        setNeedsAdminAuth(true);
        return true;
      }

      // Firestore'da kontrol et
      try {
        const docRef = doc(db, 'students', '1002');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPendingStudent({
            id: '1002',
            name: data.name || 'Admin',
            nickname: data.nickname,
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

    // Normal öğrenci girişi
    const jsonStudent = getStudents().find(s => s.id === studentId);
    if (jsonStudent) {
      localStorage.setItem('studentId', studentId);
      await loadStudent(studentId, false); // isim doğrulaması seçeneğiyle
      return true;
    }

    try {
      const docRef = doc(db, 'students', studentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        localStorage.setItem('studentId', studentId);
        await loadStudent(studentId, false);
        return true;
      }
    } catch {
      console.warn('Firestore devre dışı');
    }

    return false;
  };

  // İsim doğrulama onayı
  const confirmIdentity = () => {
    if (pendingStudent) {
      localStorage.setItem('studentId', pendingStudent.id);
      setStudent(pendingStudent);
      setPendingStudent(null);
      setNeedsConfirmation(false);
    }
  };

  // İsim doğrulama reddi
  const rejectIdentity = () => {
    setPendingStudent(null);
    setNeedsConfirmation(false);
    localStorage.removeItem('studentId');
  };

  // Admin giriş başarılı
  const confirmAdminAuth = () => {
    if (pendingStudent) {
      localStorage.setItem('studentId', pendingStudent.id);
      setStudent(pendingStudent);
      setPendingStudent(null);
      setNeedsAdminAuth(false);
    }
  };

  // Admin giriş iptal
  const cancelAdminAuth = () => {
    setPendingStudent(null);
    setNeedsAdminAuth(false);
  };

  return {
    student,
    loading,
    login,
    pendingStudent,
    needsConfirmation,
    confirmIdentity,
    rejectIdentity,
    needsDeviceApproval,
    needsAdminAuth,
    confirmAdminAuth,
    cancelAdminAuth,
  };
};
