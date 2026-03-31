import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student } from '../types/student';
import studentData from '../student_list.json';

export const useAuth = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem('studentId');
    if (storedId) {
      loadStudent(storedId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadStudent = async (id: string) => {
    // ÖNCE JSON'DA ARA (HIZLI VE ÜCRETSİZ)
    const jsonStudent = studentData.find(s => s.id === id);
    if (jsonStudent) {
      setStudent({
        id: jsonStudent.id,
        name: jsonStudent.name,
        nickname: jsonStudent.nickname,
        xp: jsonStudent.xp || 0,
        level: jsonStudent.level || 1,
        badges: [],
        avatar: jsonStudent.avatar || 'hero_1',
        lastSeen: Date.now()
      });
      setLoading(false);
      return;
    }

    // BULAMAZSA FIRESTORE'A BAK (OPSIYONEL)
    try {
      const docRef = doc(db, 'students', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStudent({
          id,
          name: data.name,
          xp: data.xp,
          level: data.level,
          badges: data.badges || [],
          avatar: data.avatar,
          lastSeen: data.lastSeen?.toMillis() || Date.now()
        });
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
    // ÖNCE JSON'DA KONTROL ET
    const jsonStudent = studentData.find(s => s.id === studentId);
    if (jsonStudent) {
      localStorage.setItem('studentId', studentId);
      await loadStudent(studentId);
      return true;
    }

    // BULAMAZSA FIRESTORE'A BAK
    try {
      const docRef = doc(db, 'students', studentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        localStorage.setItem('studentId', studentId);
        await loadStudent(studentId);
        return true;
      }
    } catch (error) {
      console.warn('Firestore devre dışı');
    }

    return false;
  };

  return { student, loading, login };
};
