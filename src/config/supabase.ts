import { createClient } from '@supabase/supabase-js';

// Güvenli env erişimi - TDZ hatalarını önlemek için doğrudan statik kullan (Vite build için zorunlu)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase bağlantı bilgileri bulunamadı! .env.local dosyasını kontrol edin.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

