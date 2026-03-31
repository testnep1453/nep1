import { useState, useEffect } from 'react';
import { Student } from '../types/student';
import { getStudentsFromFirebase } from '../services/dbFirebase';

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
      const students = await getStudentsFromFirebase();
      const found = students.find((s: any) => s.id === id);
      if (found) {
        setStudent(found as Student);
      } else {
        localStorage.removeItem('studentId');
      }
    } catch (e) {
      console.error(e);
      localStorage.removeItem('studentId');
    } finally {
      setLoading(false);
    }
  };

  const login = async (studentId: string): Promise<boolean> => {
    try {
      const students = await getStudentsFromFirebase();
      const found = students.find((s: any) => s.id === studentId);
      if (found) {
        localStorage.setItem('studentId', studentId);
        await loadStudent(studentId);
        return true;
      }
    } catch(e) {
      console.error(e);
    }
    return false;
  };

  return { student, loading, login };
};
