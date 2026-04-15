/**
 * Sistem Ayarları Servisi
 * 
 * Hardcoded (el yazımı) değerleri ortadan kaldırmak için Supabase'deki
 * `settings` tablosundan dinamik olarak çeker.
 * 
 * Konfigürasyon anahtarları:
 *   settings/{id: 'system_config'}  → { zoomLink, lessonTitle, ... }
 */

import { supabase } from '../config/supabase';

export interface SystemConfig {
  zoomLink: string;
  lessonTitle?: string;
  manual_lesson_active?: boolean;
}

const FALLBACK_CONFIG: SystemConfig = {
  zoomLink: '',
  lessonTitle: 'NEP Haftalık Ders',
};

let cachedConfig: SystemConfig | null = null;

/**
 * Sistem konfigürasyonunu Supabase'den yükler.
 * İlk yüklemede önbelleğe alır; aynı session'da tekrar çağrıldığında
 * önbellekten döner.
 */
export const getSystemConfig = async (): Promise<SystemConfig> => {
  if (cachedConfig) return cachedConfig;
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'system_config')
      .maybeSingle();

    if (error || !data) {
      cachedConfig = FALLBACK_CONFIG;
    } else {
      cachedConfig = { ...FALLBACK_CONFIG, ...(data.data as Partial<SystemConfig>) };
    }
  } catch {
    cachedConfig = FALLBACK_CONFIG;
  }
  return cachedConfig;
};

/**
 * Sadece Zoom linkini hızlıca çeker (önbellekli).
 */
export const getZoomLink = async (): Promise<string> => {
  const cfg = await getSystemConfig();
  return cfg.zoomLink;
};

/**
 * Sistem konfigürasyonunu Supabase'e kaydet (Admin kullanımı).
 */
export const saveSystemConfig = async (config: Partial<SystemConfig>): Promise<void> => {
  const current = await getSystemConfig();
  const merged = { ...current, ...config };
  await supabase.from('settings').upsert({ id: 'system_config', data: merged });
  cachedConfig = merged; // önbelleği anında güncelle
};

/**
 * Önbelleği temizler (test veya hot-reload için).
 */
export const clearSystemConfigCache = () => {
  cachedConfig = null;
};

/**
 * Manuel ders override durumunu okur.
 */
export const getManualLessonActive = async (): Promise<boolean> => {
  const cfg = await getSystemConfig();
  return cfg.manual_lesson_active === true;
};

/**
 * Manuel ders override ayarını Supabase'e yazar.
 */
export const setManualLessonActive = async (active: boolean): Promise<void> => {
  clearSystemConfigCache();
  await saveSystemConfig({ manual_lesson_active: active });
};
