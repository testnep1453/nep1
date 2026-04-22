import { createClient } from '@supabase/supabase-js';

// KESİN ÇÖZÜM: Vite build sırasında env variables (Secret) sorunlarını tamamen baypas etmek için 
// anahtarlar doğrudan buraya sabitlendi. Bu public bir anon-key olduğu için güvenlik riski 
// oluşturmaz, veritabanı RLS (Row Level Security) ile korunmaktadır.
const supabaseUrl = 'https://ncihoahtxsdsiethcwwa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaWhvYWh0eHNkc2lldGhjd3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzkyMjgsImV4cCI6MjA5MTI1NTIyOH0.aAH719YV-Eg-PJTB0KCmOHb44FpEGgfeTfJlzvlCVnc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


