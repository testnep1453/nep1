import seedData from '../student_list.json';
import { Student } from '../types/student';

const initializeDb = () => {
  if (!localStorage.getItem('studentdb')) {
    localStorage.setItem('studentdb', JSON.stringify(seedData));
  }
  if (!localStorage.getItem('messagesdb')) {
    localStorage.setItem('messagesdb', JSON.stringify([{
      id: "demo-msg",
      text: "Sisteme operasyonel girişler sağlandı. Ajanların dikkatine!",
      date: Date.now()
    }]));
  }
};

export const getStudents = (): Student[] => {
  initializeDb();
  const data = localStorage.getItem('studentdb');
  return data ? JSON.parse(data) : [];
};

export const saveStudents = (students: Student[]) => {
  localStorage.setItem('studentdb', JSON.stringify(students));
};

export const addStudent = (student: Student) => {
  const students = getStudents();
  students.push(student);
  saveStudents(students);
};

export const updateStudent = (id: string, updates: Partial<Student>) => {
  const students = getStudents();
  const index = students.findIndex((s) => s.id === id);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates };
    saveStudents(students);
  }
};

export const removeStudent = (id: string) => {
  const students = getStudents();
  saveStudents(students.filter((s) => s.id !== id));
};

export interface AppMessage {
  id: string;
  text: string;
  date: number;
}

export const getMessages = (): AppMessage[] => {
  initializeDb();
  const data = localStorage.getItem('messagesdb');
  return data ? JSON.parse(data) : [];
};

export const addMessage = (text: string) => {
  const messages = getMessages();
  messages.unshift({ id: Date.now().toString(), text, date: Date.now() });
  localStorage.setItem('messagesdb', JSON.stringify(messages));
};
