-- ============================================================
-- FoodoraX — Backfill rider delivery counts & ratings
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
--
-- riders.total_deliveries / avg_rating are denormalized counters kept up to
-- date by triggers for NEW activity. Deliveries/reviews that happened before
-- those triggers existed were never counted, so the admin panel showed 0.
-- This recomputes both from the source-of-truth tables.
-- ============================================================

-- Total deliveries = count of this rider's delivered orders
UPDATE riders rd SET total_deliveries = (
  SELECT COUNT(*) FROM orders o
  WHERE o.rider_id = rd.id AND o.status = 'delivered'
);

-- Average rating = mean of delivery_rating from reviews on this rider's orders
UPDATE riders rd SET avg_rating = COALESCE((
  SELECT AVG(r.delivery_rating)::DECIMAL(3,2)
  FROM reviews r
  JOIN orders o ON o.id = r.order_id
  WHERE o.rider_id = rd.id AND r.delivery_rating IS NOT NULL
), 0);
