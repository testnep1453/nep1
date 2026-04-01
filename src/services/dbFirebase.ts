import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student, Trailer, AttendanceRecord } from '../types/student';

export interface AppMessage {
  id: string;
  text: string;
  date: number;
}

// REALTIME FIREBASE MESSAGES
export const subscribeToMessages = (callback: (messages: AppMessage[]) => void) => {
  try {
    const q = query(collection(db, 'messages'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        date: doc.data().date
      }));
      callback(messages);
    }, (error) => {
      console.warn("Firestore messages error:", error);
      callback([]); // Fallback
    });
  } catch (e) {
    console.warn("Firebase not fully configured", e);
    callback([]);
    return () => {};
  }
};

export const addMessageToFirebase = async (text: string) => {
  try {
    await addDoc(collection(db, 'messages'), {
      text,
      date: Date.now()
    });
  } catch(e) {
    console.warn("Failed to add message", e);
  }
};

// STUDENTS API
import seedData from '../student_list.json';

export const getStudentsFromFirebase = async (): Promise<Student[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'students'));
    if (snapshot.empty) {
      return seedData as Student[];
    }
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Student[];
  } catch(e) {
    return seedData as Student[];
  }
};

export const addStudentToFirebase = async (student: Student) => {
  await setDoc(doc(db, 'students', student.id), student);
};

export const updateStudentInFirebase = async (id: string, updates: Partial<Student>) => {
  const ref = doc(db, 'students', id);
  await updateDoc(ref, updates);
};

export const removeStudentFromFirebase = async (id: string) => {
  await deleteDoc(doc(db, 'students', id));
};

// --- FRAGMAN İŞLEMLERİ ---

export const subscribeToTrailer = (callback: (trailer: Trailer | null) => void) => {
  try {
    return onSnapshot(doc(db, 'settings', 'trailer'), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Trailer);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('Trailer dinleme hatası:', error);
      callback(null);
    });
  } catch (e) {
    callback(null);
    return () => {};
  }
};

export const setTrailer = async (trailer: Omit<Trailer, 'isActive'>) => {
  await setDoc(doc(db, 'settings', 'trailer'), {
    ...trailer,
    isActive: true,
  });
};

export const disableTrailer = async () => {
  await setDoc(doc(db, 'settings', 'trailer'), {
    youtubeId: '',
    showDate: '',
    showTime: '',
    isActive: false,
  });
};

extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ') → 'dQw4w9WgXcQ'
export const extractYoutubeId = (url: string): string => {
  if (!url) return '';
  const match = url.match(/(?:v\/|youtu\.be\/|v=|embed\/)([^&?\s]{11})/);
  return match ? match[1] : url.slice(0, 11);
};

// --- TOPLU ÖĞRENCİ EKLEME ---

export const addStudentsBatch = async (students: Student[]) => {
  const batch = writeBatch(db);
  students.forEach((student) => {
    batch.set(doc(db, 'students', student.id), student);
  });
  await batch.commit();
};
