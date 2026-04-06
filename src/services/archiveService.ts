import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ArchiveVideo {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  addedAt: number;
  addedBy: string;
  lessonDate?: string;
}

const extractYoutubeId = (url: string): string => {
  if (!url) return '';
  const match = url.match(/(?:v\/|youtu\.be\/|v=|embed\/)([^&?\s]{11})/);
  return match ? match[1] : url.slice(0, 11);
};

export const getArchiveVideos = async (): Promise<ArchiveVideo[]> => {
  try {
    const q = query(collection(db, 'archive'), orderBy('addedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as ArchiveVideo[];
  } catch {
    return [];
  }
};

export const addArchiveVideo = async (
  title: string,
  youtubeUrl: string,
  addedBy: string,
  lessonDate?: string
): Promise<void> => {
  const youtubeId = extractYoutubeId(youtubeUrl);
  if (!youtubeId) throw new Error('Geçersiz YouTube URL');

  await addDoc(collection(db, 'archive'), {
    title,
    youtubeUrl,
    youtubeId,
    thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    addedAt: Date.now(),
    addedBy,
    lessonDate: lessonDate || '',
  });
};

export const removeArchiveVideo = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'archive', id));
};
