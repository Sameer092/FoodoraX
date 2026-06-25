-- ============================================================
-- FoodoraX — Proper rider payout (platform pays the rider)
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
--
-- Riders are paid by the PLATFORM: base pay + (distance × per-km rate),
-- using the admin-controlled platform_settings. This is independent of
-- whether the CUSTOMER paid a delivery fee (free-delivery orders still
-- pay the rider).
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_payout DECIMAL(10,2) DEFAULT 0;

-- Distance helper (km) between two lat/lng points
CREATE OR REPLACE FUNCTION haversine_km(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
RETURNS DECIMAL AS $$
  SELECT 6371 * acos(
    LEAST(1, GREATEST(-1,
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1))
      + sin(radians(lat1)) * sin(radians(lat2))
    ))
  );
$$ LANGUAGE SQL IMMUTABLE;

-- Compute payout when an order becomes delivered
CREATE OR REPLACE FUNCTION compute_rider_payout()
RETURNS TRIGGER AS $$
DECLARE
  v_base   DECIMAL;
  v_per_km DECIMAL;
  r_lat DECIMAL; r_lng DECIMAL;
  d_lat DECIMAL; d_lng DECIMAL;
  dist_km DECIMAL := 0;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') AND NEW.rider_id IS NOT NULL THEN
    SELECT rider_base_pay, rider_per_km INTO v_base, v_per_km FROM platform_settings WHERE id = 1;
    SELECT latitude, longitude INTO r_lat, r_lng FROM restaurants WHERE id = NEW.restaurant_id;
    SELECT latitude, longitude INTO d_lat, d_lng FROM delivery_addresses WHERE id = NEW.delivery_address_id;

    IF r_lat IS NOT NULL AND d_lat IS NOT NULL THEN
      dist_km := haversine_km(r_lat, r_lng, d_lat, d_lng);
    END IF;

    NEW.rider_payout := ROUND(COALESCE(v_base, 2.00) + COALESCE(v_per_km, 0.50) * COALESCE(dist_km, 0), 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_rider_payout ON orders;
CREATE TRIGGER trg_compute_rider_payout
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION compute_rider_payout();

-- Backfill already-delivered orders (correlated subquery so it can reference o)
UPDATE orders o SET rider_payout = ROUND((
  SELECT ps.rider_base_pay
    + ps.rider_per_km * COALESCE(haversine_km(r.latitude, r.longitude, da.latitude, da.longitude), 0)
  FROM platform_settings ps
  JOIN restaurants r ON r.id = o.restaurant_id
  LEFT JOIN delivery_addresses da ON da.id = o.delivery_address_id
  WHERE ps.id = 1
), 2)
WHERE o.status = 'delivered' AND o.rider_id IS NOT NULL;
