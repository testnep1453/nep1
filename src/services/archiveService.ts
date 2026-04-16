/**
 * Arşiv Servisi — Supabase tabanlı
 *
 * Supabase'de 'archive' tablosu gereklidir.
 * Tablo şeması:
 *   id          bigserial PRIMARY KEY
 *   title       text NOT NULL
 *   youtubeUrl  text NOT NULL
 *   youtubeId   text NOT NULL
 *   thumbnailUrl text
 *   addedAt     bigint
 *   addedBy     text
 *
 * Tablo yoksa (404) işlemler sessizce başarısız olur, uygulama çökmez.
 */
import { supabase } from '../config/supabase';

export interface ArchiveVideo {
  id: number;
  title: string;
  youtube_url: string;
  youtube_id: string;
  thumbnail_url: string;
  added_at: string;
  added_by: string;
}

export const extractYoutubeId = (url: string): string => {
  if (!url) return '';
  const match = url.match(/(?:v\/|youtu\.be\/|v=|embed\/|shorts\/)([^&?\s]{11})/i);
  return match ? match[1] : url.trim();
};

export const getArchiveVideos = async (): Promise<ArchiveVideo[]> => {
  try {
    const { data, error } = await supabase
      .from('archive')
      .select('*')
      .order('added_at', { ascending: false });
    if (error) {
      return [];
    }
    return (data || []).map(v => ({
      id: v.id,
      title: v.title,
      youtube_url: v.youtube_url,
      youtube_id: v.youtube_id,
      thumbnail_url: v.thumbnail_url,
      added_at: v.added_at,
      added_by: v.added_by
    }));
  } catch {
    return [];
  }
};

export const addArchiveVideo = async (
  title: string,
  youtubeUrl: string,
  addedBy: string
): Promise<void> => {
  const youtubeId = extractYoutubeId(youtubeUrl);
  if (!youtubeId) throw new Error('Geçersiz YouTube URL — video ID bulunamadı.');
  const { error } = await supabase.from('archive').insert([{
    title,
    youtube_url: youtubeUrl,
    youtube_id: youtubeId,
    thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
    added_at: new Date().toISOString(),
    added_by: addedBy,
  }]);
  if (error) throw new Error('Eklenemedi: ' + error.message);
};

export const removeArchiveVideo = async (id: number): Promise<void> => {
  const { error } = await supabase.from('archive').delete().eq('id', id);
  if (error) throw new Error('Silinemedi: ' + error.message);
};
