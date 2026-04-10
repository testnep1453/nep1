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
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  addedAt: number;
  addedBy: string;
}

const extractYoutubeId = (url: string): string => {
  if (!url) return '';
  const match = url.match(/(?:v\/|youtu\.be\/|v=|embed\/)([^&?\s]{11})/);
  return match ? match[1] : url.slice(0, 11);
};

export const getArchiveVideos = async (): Promise<ArchiveVideo[]> => {
  try {
    const { data, error } = await supabase
      .from('archive')
      .select('*')
      .order('addedAt', { ascending: false });
    if (error) {
      // Tablo henüz oluşturulmadıysa sessizce boş dizi döndür
      console.warn('[Archive] Tablo erişim hatası (muhtemelen henüz oluşturulmadı):', error.message);
      return [];
    }
    return (data ?? []) as ArchiveVideo[];
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
    youtubeUrl,
    youtubeId,
    thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    addedAt: Date.now(),
    addedBy,
  }]);
  if (error) throw new Error('Eklenemedi: ' + error.message);
};

export const removeArchiveVideo = async (id: number): Promise<void> => {
  const { error } = await supabase.from('archive').delete().eq('id', id);
  if (error) throw new Error('Silinemedi: ' + error.message);
};
