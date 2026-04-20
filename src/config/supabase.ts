import { createClient } from '@supabase/supabase-js';

// Güvenli env erişimi - TDZ hatalarını önlemek için doğrudan statik kullan (Vite build için zorunlu)
// NOT: Github Secrets değişkenleri boş dönerse uygulamanın çökmemesi için geçerli fallback değerleri eklendi!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ncihoahtxsdsiethcwwa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaWhvYWh0eHNkc2lldGhjd3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzkyMjgsImV4cCI6MjA5MTI1NTIyOH0.aAH719YV-Eg-PJTB0KCmOHb44FpEGgfeTfJlzvlCVnc';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase bağlantı bilgileri bulunamadı!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

