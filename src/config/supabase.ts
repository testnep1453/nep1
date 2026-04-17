import { createClient } from '@supabase/supabase-js';

// Güvenli env erişimi - TDZ hatalarını önlemek için varsayılan değerler kullan
const getEnvVar = (key: string): string => {
  try {
    const value = import.meta.env[key];
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase bağlantı bilgileri bulunamadı! .env.local dosyasını kontrol edin.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

