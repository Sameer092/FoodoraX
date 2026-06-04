-- ============================================================
-- FoodoraX — Update rider rating from review delivery ratings
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
--
-- A review has a `delivery_rating`. That should update the rating
-- of the RIDER who delivered that order (orders.rider_id).
-- Restaurants already get rated (migration 001); riders did not.
-- ============================================================

CREATE OR REPLACE FUNCTION update_rider_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_rider_id UUID;
BEGIN
  SELECT rider_id INTO v_rider_id FROM orders WHERE id = NEW.order_id;

  IF v_rider_id IS NOT NULL THEN
    UPDATE riders SET
      avg_rating = COALESCE((
        SELECT AVG(r.delivery_rating)::DECIMAL(3,2)
        FROM reviews r
        JOIN orders o ON o.id = r.order_id
        WHERE o.rider_id = v_rider_id AND r.delivery_rating IS NOT NULL
      ), 0),
      updated_at = NOW()
    WHERE id = v_rider_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_rider_rating ON reviews;
CREATE TRIGGER trg_update_rider_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_rider_rating();

-- Also keep riders.total_deliveries accurate when an order is delivered
CREATE OR REPLACE FUNCTION bump_rider_deliveries()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') AND NEW.rider_id IS NOT NULL THEN
    UPDATE riders SET
      total_deliveries = COALESCE(total_deliveries, 0) + 1,
      updated_at = NOW()
    WHERE id = NEW.rider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_bump_rider_deliveries ON orders;
CREATE TRIGGER trg_bump_rider_deliveries
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION bump_rider_deliveries();

-- Backfill: recompute every rider's rating from existing reviews
UPDATE riders rd SET avg_rating = COALESCE((
  SELECT AVG(r.delivery_rating)::DECIMAL(3,2)
  FROM reviews r
  JOIN orders o ON o.id = r.order_id
  WHERE o.rider_id = rd.id AND r.delivery_rating IS NOT NULL
), 0);
