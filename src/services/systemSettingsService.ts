/**
 * Sistem Ayarları Servisi
 * 
 * 'zoom_link', 'manual_lesson_active' ve 'lesson_title' ayarlarını
 * Supabase üzerindeki 'settings' tablosundan (id/data yapısı) yönetir.
 */

import { supabase } from '../config/supabase';

export interface SystemConfig {
  zoom_link: string;
  lesson_title: string;
  manual_lesson_active: boolean;
  login_alerts_enabled: boolean;
  maintenance_mode: {
    global: boolean;
    targeted_users: string[];
  };
  broadcast_message: string;
}

const FALLBACK_CONFIG: SystemConfig = {
  zoom_link: '',
  lesson_title: 'NEP Haftalık Ders',
  manual_lesson_active: false,
  login_alerts_enabled: false,
  maintenance_mode: {
    global: false,
    targeted_users: [],
  },
  broadcast_message: '',
};

const SYSTEM_CONFIG_ID = 'system_config';

/**
 * Tüm sistem konfigürasyonunu Supabase'den yükler.
 * 'settings' tablosu id/data sütunlarını kullanır.
 */
export const getSystemConfig = async (): Promise<SystemConfig> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('"data"')
      .eq('"id"', SYSTEM_CONFIG_ID)
      .maybeSingle();

    if (error || !data) return FALLBACK_CONFIG;
    return { ...FALLBACK_CONFIG, ...((data as any).data as Partial<SystemConfig>) };
  } catch {
    return FALLBACK_CONFIG;
  }
};

export const getZoomLink = async (): Promise<string> => {
  const cfg = await getSystemConfig();
  return cfg.zoom_link || '';
};

export const saveSystemConfig = async (config: Partial<SystemConfig>): Promise<void> => {
  try {
    const current = await getSystemConfig();
    const merged = { ...current, ...config };
    
    await supabase
      .from('settings')
      .upsert({ "id": SYSTEM_CONFIG_ID, "data": merged }, { onConflict: '"id"' });
  } catch (error) {
    console.error("Sistem konfigürasyonu kaydedilirken hata:", error);
    throw error;
  }
};

export const getManualLessonActive = async (): Promise<boolean> => {
  const cfg = await getSystemConfig();
  return cfg.manual_lesson_active === true;
};

export const setManualLessonActive = async (active: boolean): Promise<void> => {
  await saveSystemConfig({ manual_lesson_active: active });
};

