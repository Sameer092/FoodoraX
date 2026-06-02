-- ============================================================
-- FoodoraX — Admin role, platform settings, approval flow
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- PART 1: Platform settings (admin-controlled rider pay etc.)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  id                   INT PRIMARY KEY DEFAULT 1,
  rider_base_pay       DECIMAL(10,2) NOT NULL DEFAULT 2.00,
  rider_per_km         DECIMAL(10,2) NOT NULL DEFAULT 0.50,
  platform_commission  DECIMAL(5,2)  NOT NULL DEFAULT 15.00,  -- percent
  min_payout           DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read settings" ON platform_settings;
CREATE POLICY "Anyone can read settings"
  ON platform_settings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admin can update settings" ON platform_settings;
CREATE POLICY "Admin can update settings"
  ON platform_settings FOR UPDATE USING (is_admin());

-- ─────────────────────────────────────────────────────────
-- PART 2: Admin can manage restaurants & riders (approval)
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can update any restaurant" ON restaurants;
CREATE POLICY "Admin can update any restaurant"
  ON restaurants FOR UPDATE USING (is_admin() OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Admin can view all riders" ON riders;
CREATE POLICY "Admin can view all riders"
  ON riders FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admin can update any rider" ON riders;
CREATE POLICY "Admin can update any rider"
  ON riders FOR UPDATE USING (is_admin() OR id = auth.uid());

-- Admin can read all users (for the user management screen)
DROP POLICY IF EXISTS "Admin reads all users" ON users;
CREATE POLICY "Admin reads all users"
  ON users FOR SELECT USING (id = auth.uid() OR is_admin());

-- ─────────────────────────────────────────────────────────
-- PART 3: Create the admin account
-- Login: admin@foodorax.com / admin123
-- ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'ad000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'admin@foodorax.com',
  crypt('admin123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"FoodoraX Admin","role":"admin"}',
  FALSE, '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role)
VALUES ('ad000000-0000-0000-0000-000000000001', 'admin@foodorax.com', 'FoodoraX Admin', 'admin')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- PART 4: New restaurants start unverified (pending approval).
-- Demo restaurants from migration 004 stay verified.
-- ─────────────────────────────────────────────────────────
ALTER TABLE restaurants ALTER COLUMN is_verified SET DEFAULT FALSE;
