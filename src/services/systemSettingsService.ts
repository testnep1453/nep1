/**
 * Sistem Ayarları Servisi
 * 
 * Sadece 'zoom_link', 'manual_lesson_active' ve 'lesson_title' ayarlarını
 * Supabase üzerindeki 'system_settings' tablosundan (key/value yapısı) yönetir.
 */

import { supabase } from '../config/supabase';

export interface SystemConfig {
  zoom_link: string;
  lesson_title: string;
  manual_lesson_active: boolean;
}

const FALLBACK_CONFIG: SystemConfig = {
  zoom_link: '',
  lesson_title: 'NEP Haftalık Ders',
  manual_lesson_active: false,
};

/**
 * Tüm sistem konfigürasyonunu Supabase'den yükler.
 * system_settings tablosu key/value sütunlarını kullanır.
 */
export const getSystemConfig = async (): Promise<SystemConfig> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (error || !data) return FALLBACK_CONFIG;

    const config = { ...FALLBACK_CONFIG };
    data.forEach((row: any) => {
      if (row.key === 'zoom_link') config.zoom_link = row.value;
      if (row.key === 'lesson_title') config.lesson_title = row.value;
      if (row.key === 'manual_lesson_active') config.manual_lesson_active = row.value === 'true' || row.value === true;
    });

    return config;
  } catch {
    return FALLBACK_CONFIG;
  }
};

export const getZoomLink = async (): Promise<string> => {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'zoom_link')
    .maybeSingle();
  return data?.value || '';
};

export const saveSystemConfig = async (config: Partial<SystemConfig>): Promise<void> => {
  const promises = [];
  
  if (config.zoom_link !== undefined) {
    promises.push(supabase.from('system_settings').upsert({ key: 'zoom_link', value: config.zoom_link }));
  }
  if (config.lesson_title !== undefined) {
    promises.push(supabase.from('system_settings').upsert({ key: 'lesson_title', value: config.lesson_title }));
  }
  if (config.manual_lesson_active !== undefined) {
    promises.push(supabase.from('system_settings').upsert({ key: 'manual_lesson_active', value: String(config.manual_lesson_active) }));
  }

  await Promise.all(promises);
};

export const getManualLessonActive = async (): Promise<boolean> => {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'manual_lesson_active')
    .maybeSingle();
  return data?.value === 'true' || data?.value === true;
};

export const setManualLessonActive = async (active: boolean): Promise<void> => {
  await supabase
    .from('system_settings')
    .upsert({ key: 'manual_lesson_active', value: String(active) });
};

/**
 * system_settings tablosundaki belirli bir key'i dinlemek için özel abonelik
 */
export const subscribeToSystemKey = (key: string, callback: (value: string) => void) => {
  // İlk değeri çek
  supabase.from('system_settings').select('value').eq('key', key).maybeSingle().then(({ data }) => {
    if (data) callback(data.value);
  });

  const channelName = `system_settings_${key}_${Date.now()}`;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'system_settings', filter: `key=eq.${key}` }, 
      (payload: any) => {
        if (payload.new && payload.new.value !== undefined) {
          callback(payload.new.value);
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};
