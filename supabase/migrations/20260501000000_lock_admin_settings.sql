-- Lock down the rows in app_settings that hold admin auth secrets so the
-- public anon key (visible to anyone who opens DevTools) cannot read or
-- modify them. The auth-server uses SUPABASE_SERVICE_ROLE_KEY which bypasses
-- RLS, so server-side login / forgot-password / reset still work.
--
-- Rows protected: any key starting with `admin-` (currently
--   `admin-credential` — the bcrypt password hash
--   `admin-reset-token` — one-shot password-reset token).
-- Other keys (pricing-config, event-margin-config, manager-salary, etc.)
-- remain accessible to anon since the dashboard reads/writes them directly.
--
-- *** PREREQUISITE *** — set the SUPABASE_SERVICE_ROLE_KEY env var on
-- Vercel BEFORE running this migration. Otherwise login will break: the
-- auth-server will try to read admin-credential with the anon key, hit
-- the new RLS policy, and 0-row back, and you'll be locked out.

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Drop the wide-open policies if any prior migration / dashboard created
-- them. Names match the catch-all "anyone can X" pattern Supabase suggests
-- by default. IF EXISTS keeps this script idempotent across environments.
DROP POLICY IF EXISTS "Anyone can view app_settings" ON app_settings;
DROP POLICY IF EXISTS "Anyone can insert app_settings" ON app_settings;
DROP POLICY IF EXISTS "Anyone can update app_settings" ON app_settings;
DROP POLICY IF EXISTS "Anyone can delete app_settings" ON app_settings;
DROP POLICY IF EXISTS "Public read access to app_settings" ON app_settings;
DROP POLICY IF EXISTS "Public write access to app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_read_app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_write_app_settings" ON app_settings;

-- Anon may read every key EXCEPT those reserved for admin auth.
CREATE POLICY "anon_read_non_admin_settings"
  ON app_settings
  FOR SELECT
  TO anon
  USING (key NOT LIKE 'admin-%');

-- Anon may insert/update non-admin keys (used for cross-device config sync).
CREATE POLICY "anon_insert_non_admin_settings"
  ON app_settings
  FOR INSERT
  TO anon
  WITH CHECK (key NOT LIKE 'admin-%');

CREATE POLICY "anon_update_non_admin_settings"
  ON app_settings
  FOR UPDATE
  TO anon
  USING (key NOT LIKE 'admin-%')
  WITH CHECK (key NOT LIKE 'admin-%');

-- Same access for the `authenticated` role (Supabase Auth users) — we don't
-- use Supabase Auth in this app but keeping parity prevents surprises if
-- you ever flip on Supabase Auth-based features.
CREATE POLICY "authenticated_read_non_admin_settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (key NOT LIKE 'admin-%');

CREATE POLICY "authenticated_insert_non_admin_settings"
  ON app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (key NOT LIKE 'admin-%');

CREATE POLICY "authenticated_update_non_admin_settings"
  ON app_settings
  FOR UPDATE
  TO authenticated
  USING (key NOT LIKE 'admin-%')
  WITH CHECK (key NOT LIKE 'admin-%');

-- Deliberately NO delete policy and NO admin-* policy: deletes and admin-*
-- access are restricted to the service_role key (which bypasses RLS).
--
-- To verify: open the SQL editor and run
--   SELECT key FROM app_settings;
-- as anon (use the anon key from your dashboard). The admin-* rows must
-- not appear. Run the same query with the service-role key — they should.
