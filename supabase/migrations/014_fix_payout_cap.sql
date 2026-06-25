-- ============================================================
-- FoodoraX — Cap rider payout distance (fixes absurd payouts)
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
--
-- Old demo orders had a restaurant and delivery address on opposite sides
-- of the world (data created across migrations), producing a ~20,000 km
-- "distance" and a $10,000 payout. Real deliveries are local, so we cap the
-- billable distance at 30 km.
-- ============================================================

CREATE OR REPLACE FUNCTION compute_rider_payout()
RETURNS TRIGGER AS $$
DECLARE
  v_base DECIMAL; v_per_km DECIMAL;
  r_lat DECIMAL; r_lng DECIMAL; d_lat DECIMAL; d_lng DECIMAL;
  dist_km DECIMAL := 0;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') AND NEW.rider_id IS NOT NULL THEN
    SELECT rider_base_pay, rider_per_km INTO v_base, v_per_km FROM platform_settings WHERE id = 1;
    SELECT latitude, longitude INTO r_lat, r_lng FROM restaurants WHERE id = NEW.restaurant_id;
    SELECT latitude, longitude INTO d_lat, d_lng FROM delivery_addresses WHERE id = NEW.delivery_address_id;

    IF r_lat IS NOT NULL AND d_lat IS NOT NULL THEN
      dist_km := LEAST(haversine_km(r_lat, r_lng, d_lat, d_lng), 30); -- cap at 30km
    END IF;

    NEW.rider_payout := ROUND(COALESCE(v_base, 2.00) + COALESCE(v_per_km, 0.50) * COALESCE(dist_km, 0), 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recompute every delivered order's payout with the cap applied
UPDATE orders o SET rider_payout = ROUND((
  SELECT ps.rider_base_pay
    + ps.rider_per_km * LEAST(COALESCE(haversine_km(r.latitude, r.longitude, da.latitude, da.longitude), 0), 30)
  FROM platform_settings ps
  JOIN restaurants r ON r.id = o.restaurant_id
  LEFT JOIN delivery_addresses da ON da.id = o.delivery_address_id
  WHERE ps.id = 1
), 2)
WHERE o.status = 'delivered' AND o.rider_id IS NOT NULL;
