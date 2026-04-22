-- ============================================================
-- NEP Supabase RLS (Row Level Security) Politika Önerileri
-- ============================================================
-- ÖNEMLI NOT:
-- Bu uygulama şu an tamamen istemci taraflıdır (Edge Function yok).
-- Anon key tarayıcıya açık; gerçek güvenlik RLS politikalarına dayanır.
--
-- Phase 2 önerisi: admin_auth işlemlerini (bcrypt doğrulama, TOTP) bir
-- Supabase Edge Function'a taşı. service_role key hiçbir zaman tarayıcıya
-- gönderilmemeli. Şu an hash, client'a indirilip karşılaştırılıyor — bu
-- düşük riskli ama en iyi pratik değil.
-- ============================================================

-- Önce tüm tablolarda RLS'yi etkinleştir
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- settings tablosu
-- ============================================================
-- admin_auth satırı: Mevcut yaklaşımda anon okuyup yazıyor (zorunlu).
-- Phase 2'de bu satır sadece Edge Function service_role ile yazılmalı.
-- Bu geçici politika uygulamanın çalışması için gereklidir.

-- Tüm settings satırları anon tarafından okunabilir (system_config, surveys vs.)
CREATE POLICY "settings_read_anon" ON settings
  FOR SELECT USING (true);

-- Tüm settings satırları anon tarafından yazılabilir (geçici — Phase 2'de kısıtlanacak)
CREATE POLICY "settings_write_anon" ON settings
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- students tablosu
-- ============================================================
-- Öğrenciler kendi kayıtlarını okuyabilir (authenticated gerekmiyor — anon).
CREATE POLICY "students_read_anon" ON students
  FOR SELECT USING (true);

-- Upsert: uygulama yeni öğrenci kaydı oluşturabilir
CREATE POLICY "students_insert_anon" ON students
  FOR INSERT WITH CHECK (true);

-- Güncelleme: sadece kendi ID'siyle eşleşen satır (uygulama güveniyor)
-- Gerçek izolasyon için auth.uid() → student.id mapping gerekir (Phase 2)
CREATE POLICY "students_update_anon" ON students
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- attendance tablosu
-- ============================================================
-- Insert: herkes ekleyebilir (yoklama kaydı)
CREATE POLICY "attendance_insert_anon" ON attendance
  FOR INSERT WITH CHECK (true);

-- Okuma: herkes okuyabilir (admin dashboard)
CREATE POLICY "attendance_read_anon" ON attendance
  FOR SELECT USING (true);

-- Güncelleme ve silme: anon kısıtlı (sadece admin — Phase 2'de service_role ile)
-- Şimdilik kapalı; admin dashboard doğrudan güncelleme yapmıyorsa sorun olmaz.
-- CREATE POLICY "attendance_update_admin" ON attendance FOR UPDATE USING (false);
-- CREATE POLICY "attendance_delete_admin" ON attendance FOR DELETE USING (false);

-- ============================================================
-- security_alerts tablosu
-- ============================================================
-- Insert-only anon (güvenlik uyarıları yazılır)
CREATE POLICY "security_alerts_insert_anon" ON security_alerts
  FOR INSERT WITH CHECK (true);

-- Okuma: sadece service_role (admin dashboard direkt okuyorsa aşağıyı aç)
-- Phase 2'de Edge Function üzerinden okunmalı.
CREATE POLICY "security_alerts_read_anon" ON security_alerts
  FOR SELECT USING (true);

-- ============================================================
-- login_alerts tablosu
-- ============================================================
CREATE POLICY "login_alerts_insert_anon" ON login_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "login_alerts_read_anon" ON login_alerts
  FOR SELECT USING (true);

-- ============================================================
-- system_commands tablosu
-- ============================================================
CREATE POLICY "system_commands_insert_anon" ON system_commands
  FOR INSERT WITH CHECK (true);

CREATE POLICY "system_commands_read_anon" ON system_commands
  FOR SELECT USING (true);

CREATE POLICY "system_commands_update_anon" ON system_commands
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================
-- feedback tablosu
-- ============================================================
CREATE POLICY "feedback_insert_anon" ON feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "feedback_read_anon" ON feedback
  FOR SELECT USING (true);

-- ============================================================
-- survey_results tablosu
-- ============================================================
CREATE POLICY "survey_results_insert_anon" ON survey_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "survey_results_read_anon" ON survey_results
  FOR SELECT USING (true);

-- ============================================================
-- Phase 2 YOL HARİTASI (öncelik sırasıyla)
-- ============================================================
-- 1. admin_auth işlemlerini Supabase Edge Function'a taşı.
--    - bcrypt karşılaştırması sunucuda yapılır, hash tarayıcıya gitmez.
--    - TOTP doğrulama da Edge Function'da yapılır.
--    - service_role key sadece Edge Function'da kullanılır.
--
-- 2. settings.admin_auth satırı için anon SELECT/UPDATE kısıtla,
--    sadece Edge Function service_role erişebilsin.
--
-- 3. students tablosunda auth.uid() → student.id mapping kur,
--    her öğrenci sadece kendi satırını güncelleyebilsin.
--
-- 4. nep_crypto_key (AES key) localStorage'dan kaldır,
--    password-based KDF (PBKDF2/Argon2) ile türet.
--    Böylece key bellekte tutulmaz, her oturum açılışında türetilir.
-- ============================================================
