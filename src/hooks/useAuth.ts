import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student } from '../types/student';

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
      console.error('Error loading student:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (studentId: string): Promise<boolean> => {
    try {
      const docRef = doc(db, 'students', studentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        localStorage.setItem('studentId', studentId);
        await loadStudent(studentId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  return { student, loading, login };
};
