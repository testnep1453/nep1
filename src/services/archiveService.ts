import { supabase } from '../config/supabase';

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

// archive tablosu var mı önbelleği (bir kez kontrol et, sonra hatırla)
let archiveTableOk: boolean | null = null;

const ensureTable = async (): Promise<boolean> => {
  if (archiveTableOk !== null) return archiveTableOk;
  try {
    const { error } = await supabase.from('archive').select('id').limit(1);
    archiveTableOk = !error || (error.code !== '42P01' && !error.message?.includes('does not exist'));
  } catch {
    archiveTableOk = false;
  }
  return archiveTableOk;
};

const extractYoutubeId = (url: string): string => {
  if (!url) return '';
  const match = url.match(/(?:v\/|youtu\.be\/|v=|embed\/)([^&?\s]{11})/);
  return match ? match[1] : url.slice(0, 11);
};

export const getArchiveVideos = async (): Promise<ArchiveVideo[]> => {
  const ok = await ensureTable();
  if (!ok) return [];
  try {
    const { data, error } = await supabase
      .from('archive')
      .select('*')
      .order('addedAt', { ascending: false });
    if (error) return [];
    return (data as ArchiveVideo[]) || [];
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
  const ok = await ensureTable();
  if (!ok) throw new Error('Arşiv tablosu henüz oluşturulmadı.');
  const youtubeId = extractYoutubeId(youtubeUrl);
  if (!youtubeId) throw new Error('Geçersiz YouTube URL');
  await supabase.from('archive').insert([{
    title,
    youtubeUrl,
    youtubeId,
    thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    addedAt: Date.now(),
    addedBy,
    lessonDate: lessonDate || '',
  }]);
};

export const removeArchiveVideo = async (id: string): Promise<void> => {
  const ok = await ensureTable();
  if (!ok) return;
  await supabase.from('archive').delete().eq('id', id);
};
