import { supabase } from '../config/supabase';
import { Student, Trailer, FeedbackEntry } from '../types/student';
import seedData from '../student_list.json';

export interface AppMessage { id: string; text: string; date: number; }

export const subscribeToMessages = (callback: (messages: AppMessage[]) => void) => {
  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('date', { ascending: false });
    if (data) callback(data);
  };
  fetchMessages();
  
  // Benzersiz kanal ismi çakışmayı önler
  const channelName = `messages_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchMessages)
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
};

export const addMessageToFirebase = async (text: string) => {
  await supabase.from('messages').insert([{ text, date: Date.now() }]);
};

export const getStudentsFromFirebase = async (): Promise<Student[]> => {
  const { data } = await supabase.from('students').select('*');
  return data && data.length > 0 ? data as Student[] : seedData as Student[];
};

export const addStudentToFirebase = async (student: Student) => {
  await supabase.from('students').upsert(student);
};

export const updateStudentInFirebase = async (id: string, updates: Partial<Student>) => {
  await supabase.from('students').update(updates).eq('id', id);
};

export const removeStudentFromFirebase = async (id: string) => {
  await supabase.from('students').delete().eq('id', id);
};

export const subscribeToTrailer = (callback: (trailer: Trailer | null) => void) => {
   const fetchTrailer = async () => {
     const { data } = await supabase.from('settings').select('data').eq('id', 'trailer').maybeSingle();
     callback(data ? data.data as Trailer : null);
   };
   fetchTrailer();
   // Benzersiz kanal ismi: aynı tablo için birden fazla abone çakışmasını önler
   const channelName = `settings_trailer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
   const channel = supabase.channel(channelName)
     .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `id=eq.trailer` }, fetchTrailer)
     .subscribe();
   return () => { supabase.removeChannel(channel); };
};

export const setTrailer = async (trailer: Omit<Trailer, 'isActive'>) => {
  await supabase.from('settings').upsert({ id: 'trailer', data: { ...trailer, isActive: true } });
};

export const disableTrailer = async () => {
  await supabase.from('settings').upsert({ id: 'trailer', data: { youtubeId: '', showDate: '', showTime: '', isActive: false } });
};

export const extractYoutubeId = (url: string): string => {
  if (!url) return '';
  const match = url.match(/(?:v\/|youtu\.be\/|v=|embed\/)([^&?\s]{11})/);
  return match ? match[1] : url.slice(0, 11);
};

export const addStudentsBatch = async (students: Student[]) => {
  await supabase.from('students').upsert(students);
};

export const recordAttendanceToFirebase = async (studentId: string, lessonDate: string, autoJoined: boolean = true) => {
  await supabase.from('attendance').upsert({
    id: `${lessonDate}_${studentId}`, studentId, lessonDate, joinedAt: Date.now(), autoJoined, xpEarned: 100
  });
};

export const getAttendanceForLesson = async (lessonDate: string) => {
  const { data } = await supabase.from('attendance').select('studentId, joinedAt, autoJoined').eq('lessonDate', lessonDate);
  return data || [];
};

export const getFeedbackForLesson = async (): Promise<FeedbackEntry[]> => { return []; };
export const getAllFeedback = async (): Promise<FeedbackEntry[]> => { return []; };

export const updateNickname = async (studentId: string, nickname: string) => {
  await supabase.from('students').update({ nickname }).eq('id', studentId);
};

export const saveAdminPassword = async (hashedPassword: string) => {
  await supabase.from('settings').upsert({ id: 'admin_auth', data: { passwordHash: hashedPassword, createdAt: Date.now() } });
};

export const getAdminAuth = async (): Promise<{ passwordHash: string } | null> => {
  const { data } = await supabase.from('settings').select('data').eq('id', 'admin_auth').single();
  return data ? data.data as any : null;
};

// ── Generic Settings Database (Legacy id/data in 'settings' table) ──
export const getSettingStore = async <T>(id: string, defaultData: T): Promise<T> => {
  try {
    const { data, error } = await supabase.from('settings').select('data').eq('id', id).maybeSingle();
    if (error || !data) return defaultData;
    return (data.data as T) || defaultData;
  } catch {
    return defaultData;
  }
};

export const saveSettingStore = async <T>(id: string, dataObj: T): Promise<void> => {
  await supabase.from('settings').upsert({ id, data: dataObj as any }, { onConflict: 'id' });
};

export const subscribeToSettingStore = <T>(id: string, defaultData: T, callback: (data: T) => void) => {
  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('data').eq('id', id).maybeSingle();
    callback((data ? data.data : defaultData) as T);
  };
  fetchSettings();
  // Benzersiz kanal ismi: React Strict Mode çift-mount ve çakışan aboneleri önler
  const channelName = `settings_${id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `id=eq.${id}` }, fetchSettings)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};
