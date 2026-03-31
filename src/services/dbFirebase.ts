import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Student } from '../types/student';

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
