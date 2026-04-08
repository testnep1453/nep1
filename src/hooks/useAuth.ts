import { useState, useEffect } from 'react';
import { Student } from '../types/student';
import { getStudents } from '../services/db';
import { getStudentById, upsertStudent, signOutUser, saveStudentEmail, signInAndMapStudent } from '../services/authService';
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

    try { await registerDevice(id); } catch { }

    await signInAndMapStudent(id);

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
      await saveStudentEmail(studentId, email);
      await loadStudent(studentId, true);
      return true;
    }
    return false;
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

  return { student, loading, login, loginWithGoogle, logout, pendingStudent, needsAdminAuth, confirmAdminAuth, cancelAdminAuth, needsEmailVerification, confirmEmailVerification };
};