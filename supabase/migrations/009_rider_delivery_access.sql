-- ============================================================
-- FoodoraX — Let riders see & claim available deliveries
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
--
-- Without this, RLS hides unassigned "ready" orders from riders,
-- so the rider dashboard always shows "0 nearby".
-- ============================================================

-- 1) Riders can SEE orders that are ready and not yet assigned
DROP POLICY IF EXISTS "Riders view available deliveries" ON orders;
CREATE POLICY "Riders view available deliveries"
  ON orders FOR SELECT USING (
    get_user_role() = 'rider' AND status = 'ready' AND rider_id IS NULL
  );

-- 2) Riders can CLAIM an available delivery (assign themselves).
--    USING  = which rows they may grab (ready + unassigned)
--    WITH CHECK = the updated row must set rider_id to themselves
DROP POLICY IF EXISTS "Riders claim available deliveries" ON orders;
CREATE POLICY "Riders claim available deliveries"
  ON orders FOR UPDATE
  USING (get_user_role() = 'rider' AND status = 'ready' AND rider_id IS NULL)
  WITH CHECK (get_user_role() = 'rider' AND rider_id = auth.uid());

-- 3) Riders can read the delivery address of orders they can act on
DROP POLICY IF EXISTS "Riders read order addresses" ON delivery_addresses;
CREATE POLICY "Riders read order addresses"
  ON delivery_addresses FOR SELECT USING (
    get_user_role() = 'rider' AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.delivery_address_id = delivery_addresses.id
      AND (o.rider_id = auth.uid() OR (o.status = 'ready' AND o.rider_id IS NULL))
    )
  );

-- 4) Order parties can read each other's basic profile (name/phone).
--    Lets the restaurant see the customer, the rider see the customer,
--    and the customer see the rider — only for orders they share.
DROP POLICY IF EXISTS "Read counterparties on shared orders" ON users;
CREATE POLICY "Read counterparties on shared orders"
  ON users FOR SELECT USING (
    id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE (o.customer_id = users.id OR o.rider_id = users.id)
        AND (
          o.customer_id = auth.uid()
          OR o.rider_id = auth.uid()
          OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid())
        )
    )
  );

-- 5) Make sure realtime is on for the live tracking + dashboard updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE rider_locations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
