-- ============================================================
-- FoodoraX — Seed Data
-- ============================================================

-- Promo Codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, expires_at, is_active)
VALUES
  ('WELCOME20', 'Welcome discount 20% off your first order', 'percentage', 20, 15.00, 10.00, 1000, NOW() + INTERVAL '1 year', TRUE),
  ('FLAT5OFF',  'Flat $5 off orders above $25', 'fixed', 5, 25.00, 5.00, 500, NOW() + INTERVAL '6 months', TRUE),
  ('FREESHIP',  'Free delivery on any order', 'fixed', 3.99, 10.00, 3.99, 2000, NOW() + INTERVAL '3 months', TRUE),
  ('LUNCH30',   '30% off lunch orders (11am-3pm)', 'percentage', 30, 20.00, 15.00, 300, NOW() + INTERVAL '2 months', TRUE);
