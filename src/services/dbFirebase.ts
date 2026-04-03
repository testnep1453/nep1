import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, writeBatch, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student, Trailer, FeedbackEntry } from '../types/student';

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

// URL'den YouTube video ID'sini çıkarır
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

// --- YOKLAMA İŞLEMLERİ ---

export const recordAttendanceToFirebase = async (
  studentId: string,
  lessonDate: string,
  autoJoined: boolean = true
) => {
  try {
    const attendanceRef = doc(db, 'attendance', `${lessonDate}_${studentId}`);
    await setDoc(attendanceRef, {
      studentId,
      lessonDate,
      joinedAt: Date.now(),
      autoJoined,
      xpEarned: 100,
    }, { merge: true });
  } catch (error) {
    console.error('Yoklama kaydı hatası:', error);
  }
};

export const getAttendanceForLesson = async (lessonDate: string): Promise<Array<{ studentId: string; joinedAt: number; autoJoined: boolean }>> => {
  try {
    const q = query(collection(db, 'attendance'), where('lessonDate', '==', lessonDate));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      studentId: doc.data().studentId,
      joinedAt: doc.data().joinedAt,
      autoJoined: doc.data().autoJoined,
    }));
  } catch {
    return [];
  }
};

// --- GERİ BİLDİRİM İŞLEMLERİ ---

export const getFeedbackForLesson = async (lessonDate: string): Promise<FeedbackEntry[]> => {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('lessonDate', '==', lessonDate),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FeedbackEntry[];
  } catch {
    return [];
  }
};

export const getAllFeedback = async (): Promise<FeedbackEntry[]> => {
  try {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FeedbackEntry[];
  } catch {
    return [];
  }
};

// --- NİCKNAME GÜNCELLEME (GÖREV 6) ---

export const updateNickname = async (studentId: string, nickname: string) => {
  try {
    await updateDoc(doc(db, 'students', studentId), { nickname });
  } catch (error) {
    console.error('Nickname güncelleme hatası:', error);
    throw error;
  }
};

// --- ADMIN AUTH ---

export const saveAdminPassword = async (hashedPassword: string) => {
  await setDoc(doc(db, 'admin', 'auth'), {
    passwordHash: hashedPassword,
    createdAt: Date.now(),
  });
};

export const getAdminAuth = async (): Promise<{ passwordHash: string } | null> => {
  try {
    const snap = await getDocs(query(collection(db, 'admin')));
    if (snap.empty) return null;
    const authDoc = snap.docs.find(d => d.id === 'auth');
    if (!authDoc) return null;
    return { passwordHash: authDoc.data().passwordHash };
  } catch {
    return null;
  }
};
