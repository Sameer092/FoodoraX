-- ============================================================
-- FoodoraX — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- USERS POLICIES
-- ============================================================

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Allow insert on signup"
  ON users FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can manage all users"
  ON users FOR ALL USING (is_admin());

-- ============================================================
-- RESTAURANTS POLICIES
-- ============================================================

CREATE POLICY "Anyone can view open restaurants"
  ON restaurants FOR SELECT USING (TRUE);

CREATE POLICY "Owners can create their restaurant"
  ON restaurants FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND get_user_role() = 'restaurant_owner'
  );

CREATE POLICY "Owners can update their restaurant"
  ON restaurants FOR UPDATE USING (
    owner_id = auth.uid() OR is_admin()
  );

CREATE POLICY "Admin can delete restaurants"
  ON restaurants FOR DELETE USING (is_admin());

-- ============================================================
-- RESTAURANT IMAGES POLICIES
-- ============================================================

CREATE POLICY "Anyone can view restaurant images"
  ON restaurant_images FOR SELECT USING (TRUE);

CREATE POLICY "Owners can manage their restaurant images"
  ON restaurant_images FOR ALL USING (
    EXISTS(SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
    OR is_admin()
  );

-- ============================================================
-- MENU CATEGORIES POLICIES
-- ============================================================

CREATE POLICY "Anyone can view menu categories"
  ON menu_categories FOR SELECT USING (TRUE);

CREATE POLICY "Owners can manage menu categories"
  ON menu_categories FOR ALL USING (
    EXISTS(SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
    OR is_admin()
  );

-- ============================================================
-- MENU ITEMS POLICIES
-- ============================================================

CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT USING (TRUE);

CREATE POLICY "Owners can manage menu items"
  ON menu_items FOR ALL USING (
    EXISTS(SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
    OR is_admin()
  );

-- ============================================================
-- DELIVERY ADDRESSES POLICIES
-- ============================================================

CREATE POLICY "Users can manage their own addresses"
  ON delivery_addresses FOR ALL USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- CARTS POLICIES
-- ============================================================

CREATE POLICY "Users can manage their own cart"
  ON carts FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- CART ITEMS POLICIES
-- ============================================================

CREATE POLICY "Users can manage their own cart items"
  ON cart_items FOR ALL USING (
    EXISTS(SELECT 1 FROM carts WHERE id = cart_id AND user_id = auth.uid())
  );

-- ============================================================
-- PROMO CODES POLICIES
-- ============================================================

CREATE POLICY "Anyone can read active promo codes"
  ON promo_codes FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admin can manage promo codes"
  ON promo_codes FOR ALL USING (is_admin());

-- ============================================================
-- ORDERS POLICIES
-- ============================================================

CREATE POLICY "Customers can view their own orders"
  ON orders FOR SELECT USING (
    customer_id = auth.uid()
    OR rider_id = auth.uid()
    OR EXISTS(SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT WITH CHECK (
    customer_id = auth.uid() AND get_user_role() = 'customer'
  );

CREATE POLICY "Stakeholders can update order status"
  ON orders FOR UPDATE USING (
    customer_id = auth.uid()
    OR rider_id = auth.uid()
    OR EXISTS(SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
    OR is_admin()
  );

-- ============================================================
-- ORDER ITEMS POLICIES
-- ============================================================

CREATE POLICY "Order stakeholders can view order items"
  ON order_items FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND (
        o.customer_id = auth.uid()
        OR o.rider_id = auth.uid()
        OR EXISTS(SELECT 1 FROM restaurants r WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid())
        OR is_admin()
      )
    )
  );

CREATE POLICY "System can insert order items"
  ON order_items FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid())
  );

-- ============================================================
-- PAYMENTS POLICIES
-- ============================================================

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "System can create payments"
  ON payments FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- RIDERS POLICIES
-- ============================================================

CREATE POLICY "Anyone can view verified riders"
  ON riders FOR SELECT USING (TRUE);

CREATE POLICY "Riders can update their own profile"
  ON riders FOR UPDATE USING (id = auth.uid() OR is_admin());

CREATE POLICY "System can create rider profiles"
  ON riders FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================
-- RIDER LOCATIONS POLICIES
-- ============================================================

CREATE POLICY "Authenticated users can view rider locations"
  ON rider_locations FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Riders can update their own location"
  ON rider_locations FOR ALL USING (rider_id = auth.uid() OR is_admin());

-- ============================================================
-- REVIEWS POLICIES
-- ============================================================

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT USING (TRUE);

CREATE POLICY "Customers can create reviews for their delivered orders"
  ON reviews FOR INSERT WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS(
      SELECT 1 FROM orders
      WHERE id = order_id
      AND customer_id = auth.uid()
      AND status = 'delivered'
    )
  );

CREATE POLICY "Customers can update their own reviews"
  ON reviews FOR UPDATE USING (customer_id = auth.uid() OR is_admin());

-- ============================================================
-- FAVORITES POLICIES
-- ============================================================

CREATE POLICY "Users can manage their own favorites"
  ON favorites FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT WITH CHECK (TRUE);
