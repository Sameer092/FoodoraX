-- ============================================================
-- FoodoraX — Remove unused PostGIS extension
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
--
-- PostGIS was enabled in migration 001 but never used — all coordinates are
-- plain DECIMAL columns and distance is computed with haversine_km(). The
-- extension creates a public.spatial_ref_sys table that can't have RLS enabled
-- (it's owned by the extension), which trips the Security Advisor. Dropping the
-- unused extension removes the table and clears the warning.
-- ============================================================

DROP EXTENSION IF EXISTS postgis CASCADE;
