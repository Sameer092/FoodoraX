-- ============================================================
-- FoodoraX — Complete Setup + Demo Data
-- Run this ONCE in Supabase SQL Editor. It is safe to re-run.
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- PART 1: Auto-create user profile on signup (trigger)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  )
  ON CONFLICT (id) DO NOTHING;

  IF COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer') = 'rider' THEN
    INSERT INTO public.riders (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────
-- PART 2: Clean, working RLS policies for users table
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow insert on signup" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

CREATE POLICY "users_select_own"  ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own"  ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_insert_own"  ON users FOR INSERT WITH CHECK (id = auth.uid());

-- ─────────────────────────────────────────────────────────
-- PART 3: Demo restaurant owner (so restaurants have an owner)
-- ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a demo owner in auth.users (email confirmed so it can log in)
-- Login: demo.owner@foodorax.com / password123
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'demo.owner@foodorax.com',
  crypt('password123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Owner","role":"restaurant_owner"}',
  FALSE,
  '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role)
VALUES ('a0000000-0000-0000-0000-000000000001', 'demo.owner@foodorax.com', 'Demo Owner', 'restaurant_owner')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- PART 4: Demo Restaurants
-- ─────────────────────────────────────────────────────────
INSERT INTO restaurants (id, owner_id, name, description, cuisine_type, address, city, latitude, longitude, phone, logo_url, cover_url, delivery_time, min_order, delivery_fee, is_open, is_featured, is_verified, avg_rating, total_reviews, tags)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Burger Republic', 'Gourmet smash burgers & loaded fries', ARRAY['Burgers','American'],
   '101 Sheikh Zayed Rd', 'Dubai', 25.2048, 55.2708, '+971500000001',
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
   'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
   25, 15, 0, TRUE, TRUE, TRUE, 4.7, 320, ARRAY['Popular','Free Delivery']),

  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Pizza Forno', 'Authentic wood-fired Italian pizza', ARRAY['Pizza','Italian'],
   '22 Marina Walk', 'Dubai', 25.0805, 55.1403, '+971500000002',
   'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',
   'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
   30, 20, 3.99, TRUE, TRUE, TRUE, 4.5, 210, ARRAY['Italian']),

  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'Sakura Sushi', 'Fresh sushi & Japanese favorites', ARRAY['Sushi','Japanese'],
   '5 JBR Beach', 'Dubai', 25.0757, 55.1330, '+971500000003',
   'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200',
   'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800',
   35, 25, 4.99, TRUE, TRUE, TRUE, 4.8, 180, ARRAY['Premium']),

  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'Taco Fiesta', 'Vibrant Mexican street food', ARRAY['Mexican','Tacos'],
   '88 Downtown Blvd', 'Dubai', 25.1972, 55.2744, '+971500000004',
   'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
   'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800',
   20, 12, 2.49, TRUE, FALSE, TRUE, 4.4, 95, ARRAY['Spicy']),

  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'Green Bowl', 'Healthy salads & fresh juices', ARRAY['Salads','Healthy'],
   '12 Business Bay', 'Dubai', 25.1850, 55.2620, '+971500000005',
   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200',
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
   25, 18, 0, TRUE, FALSE, TRUE, 4.6, 140, ARRAY['Healthy','Free Delivery'])
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- PART 5: Menu Categories
-- ─────────────────────────────────────────────────────────
INSERT INTO menu_categories (id, restaurant_id, name, sort_order)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Burgers', 0),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Sides & Drinks', 1),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Pizzas', 0),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Sushi Rolls', 0),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'Tacos', 0),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 'Salads', 0)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- PART 6: Menu Items
-- ─────────────────────────────────────────────────────────
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_available, is_featured, preparation_time)
VALUES
  -- Burger Republic
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','Classic Smash Burger','Double beef patty, cheddar, special sauce',8.99,'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',TRUE,TRUE,15),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','Bacon Deluxe','Crispy bacon, double cheese, caramelized onions',10.99,'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400',TRUE,FALSE,15),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','Loaded Fries','Cheese sauce, jalapeños, crispy bacon',5.49,'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',TRUE,FALSE,10),
  ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','Chocolate Shake','Thick creamy chocolate milkshake',4.99,'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',TRUE,FALSE,5),

  -- Pizza Forno
  ('b0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003','Margherita','San Marzano tomato, mozzarella, basil',11.99,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',TRUE,TRUE,20),
  ('b0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003','Pepperoni','Loaded pepperoni & extra cheese',13.99,'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',TRUE,TRUE,20),
  ('b0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000003','Quattro Formaggi','Four cheese blend pizza',14.99,'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',TRUE,FALSE,22),

  -- Sakura Sushi
  ('b0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000004','California Roll','Crab, avocado, cucumber (8 pcs)',9.99,'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',TRUE,TRUE,18),
  ('b0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000004','Salmon Nigiri','Fresh salmon over rice (6 pcs)',12.99,'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400',TRUE,TRUE,15),
  ('b0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000004','Dragon Roll','Eel, avocado, tempura shrimp (8 pcs)',15.99,'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400',TRUE,FALSE,20),

  -- Taco Fiesta
  ('b0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000005','Beef Tacos','Three soft tacos with seasoned beef',7.99,'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',TRUE,TRUE,12),
  ('b0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000005','Chicken Quesadilla','Grilled chicken & melted cheese',8.49,'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400',TRUE,FALSE,12),
  ('b0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000005','Loaded Nachos','Tortilla chips, cheese, guac, salsa',6.99,'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400',TRUE,FALSE,10),

  -- Green Bowl
  ('b0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000006','Caesar Salad','Romaine, parmesan, croutons, caesar dressing',7.49,'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',TRUE,TRUE,8),
  ('b0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000006','Quinoa Power Bowl','Quinoa, avocado, chickpeas, greens',9.99,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',TRUE,TRUE,10),
  ('b0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000006','Greek Salad','Feta, olives, tomato, cucumber',8.49,'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',TRUE,FALSE,8)
ON CONFLICT DO NOTHING;
