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
  kahoot_link: string;
  kahoot_launched_at?: number; // epoch ms — değişince tüm ajanlar sekme açar
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
  kahoot_link: '',
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
      .select('data')
      .eq('id', SYSTEM_CONFIG_ID)
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
      .upsert({ id: SYSTEM_CONFIG_ID, data: merged }, { onConflict: 'id' });
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

/** Kahoot linkini kaydeder VE kahoot_launched_at damgasını günceller.
 *  Bu, tüm online ajanların tarayıcısında otomatik sekme açılmasını tetikler. */
export const launchKahoot = async (link: string): Promise<void> => {
  const cleanLink = (link || '').trim();
  if (!cleanLink) throw new Error('Kahoot linki boş olamaz.');
  await saveSystemConfig({
    kahoot_link: cleanLink,
    kahoot_launched_at: Date.now(),
  });
};

