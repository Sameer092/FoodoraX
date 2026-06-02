-- ============================================================
-- FoodoraX — Give each demo restaurant its OWN owner account
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
--
-- Result: 5 restaurants, 5 separate logins, each owner sees
-- only their own restaurant's orders. The shared demo owner
-- (demo.owner@foodorax.com) is removed.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────
-- 1) Create 5 restaurant-owner auth accounts (email confirmed)
--    All passwords: password123
-- ─────────────────────────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000011',
   'authenticated','authenticated','burger@foodorax.com', crypt('password123', gen_salt('bf')),
   NOW(),NOW(),NOW(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Burger Republic Owner","role":"restaurant_owner"}', FALSE,'','','',''),

  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000012',
   'authenticated','authenticated','pizza@foodorax.com', crypt('password123', gen_salt('bf')),
   NOW(),NOW(),NOW(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Pizza Forno Owner","role":"restaurant_owner"}', FALSE,'','','',''),

  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000013',
   'authenticated','authenticated','sushi@foodorax.com', crypt('password123', gen_salt('bf')),
   NOW(),NOW(),NOW(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Sakura Sushi Owner","role":"restaurant_owner"}', FALSE,'','','',''),

  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000014',
   'authenticated','authenticated','taco@foodorax.com', crypt('password123', gen_salt('bf')),
   NOW(),NOW(),NOW(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Taco Fiesta Owner","role":"restaurant_owner"}', FALSE,'','','',''),

  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000015',
   'authenticated','authenticated','greenbowl@foodorax.com', crypt('password123', gen_salt('bf')),
   NOW(),NOW(),NOW(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Green Bowl Owner","role":"restaurant_owner"}', FALSE,'','','','')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- 2) Matching public.users profile rows
-- ─────────────────────────────────────────────────────────
INSERT INTO public.users (id, email, full_name, role)
VALUES
  ('a0000000-0000-0000-0000-000000000011','burger@foodorax.com','Burger Republic Owner','restaurant_owner'),
  ('a0000000-0000-0000-0000-000000000012','pizza@foodorax.com','Pizza Forno Owner','restaurant_owner'),
  ('a0000000-0000-0000-0000-000000000013','sushi@foodorax.com','Sakura Sushi Owner','restaurant_owner'),
  ('a0000000-0000-0000-0000-000000000014','taco@foodorax.com','Taco Fiesta Owner','restaurant_owner'),
  ('a0000000-0000-0000-0000-000000000015','greenbowl@foodorax.com','Green Bowl Owner','restaurant_owner')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- 3) Reassign each restaurant to its own owner (MUST run
--    before deleting the old shared owner, due to FK cascade)
-- ─────────────────────────────────────────────────────────
UPDATE restaurants SET owner_id = 'a0000000-0000-0000-0000-000000000011' WHERE id = 'b0000000-0000-0000-0000-000000000001'; -- Burger Republic
UPDATE restaurants SET owner_id = 'a0000000-0000-0000-0000-000000000012' WHERE id = 'b0000000-0000-0000-0000-000000000002'; -- Pizza Forno
UPDATE restaurants SET owner_id = 'a0000000-0000-0000-0000-000000000013' WHERE id = 'b0000000-0000-0000-0000-000000000003'; -- Sakura Sushi
UPDATE restaurants SET owner_id = 'a0000000-0000-0000-0000-000000000014' WHERE id = 'b0000000-0000-0000-0000-000000000004'; -- Taco Fiesta
UPDATE restaurants SET owner_id = 'a0000000-0000-0000-0000-000000000015' WHERE id = 'b0000000-0000-0000-0000-000000000005'; -- Green Bowl

-- Keep all demo restaurants verified/visible
UPDATE restaurants SET is_verified = TRUE
WHERE id IN (
  'b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000005'
);

-- ─────────────────────────────────────────────────────────
-- 4) Remove the old shared demo owner (now owns nothing)
-- ─────────────────────────────────────────────────────────
DELETE FROM auth.users WHERE id = 'a0000000-0000-0000-0000-000000000001';
-- public.users row cascades automatically via FK.
