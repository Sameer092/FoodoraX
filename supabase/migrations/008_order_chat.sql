-- ============================================================
-- FoodoraX — In-app order chat (customer ↔ rider ↔ restaurant)
-- Run ONCE in Supabase SQL Editor. Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS order_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages(order_id, created_at);

ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

-- Participants of the order (customer, assigned rider, restaurant owner, admin) can read
DROP POLICY IF EXISTS "chat participants read" ON order_messages;
CREATE POLICY "chat participants read"
  ON order_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_id AND (
        o.customer_id = auth.uid()
        OR o.rider_id = auth.uid()
        OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid())
        OR is_admin()
      )
    )
  );

-- Customer & assigned rider can send messages
DROP POLICY IF EXISTS "chat participants send" ON order_messages;
CREATE POLICY "chat participants send"
  ON order_messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_id AND (
        o.customer_id = auth.uid() OR o.rider_id = auth.uid()
      )
    )
  );

-- Enable realtime for live chat
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE order_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
