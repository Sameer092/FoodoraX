-- ============================================================
-- FoodoraX — Initial Schema Migration
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- NOTE: PostGIS is intentionally NOT used. All coordinates are plain DECIMAL
-- columns and distance is computed via the haversine_km() SQL function.
-- (Enabling PostGIS adds an unmanaged public.spatial_ref_sys table that trips
--  the Security Advisor's "RLS disabled" check.)

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('customer', 'restaurant_owner', 'rider', 'admin');
CREATE TYPE order_status AS ENUM (
  'pending', 'accepted', 'preparing', 'ready',
  'picked_up', 'delivered', 'cancelled', 'refunded'
);
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE payment_method_type AS ENUM ('card', 'apple_pay', 'google_pay', 'cash');
CREATE TYPE rider_status AS ENUM ('offline', 'online', 'busy');
CREATE TYPE notification_type AS ENUM (
  'order_accepted', 'order_preparing', 'order_ready',
  'rider_assigned', 'rider_nearby', 'order_delivered',
  'order_cancelled', 'promotion', 'system'
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'customer',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  push_token    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_role   ON users(role);
CREATE INDEX idx_users_phone  ON users(phone);

-- ============================================================
-- RESTAURANTS
-- ============================================================

CREATE TABLE restaurants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  cuisine_type    TEXT[],
  address         TEXT NOT NULL,
  city            TEXT NOT NULL,
  latitude        DECIMAL(10, 8),
  longitude       DECIMAL(11, 8),
  phone           TEXT,
  email           TEXT,
  logo_url        TEXT,
  cover_url       TEXT,
  opening_time    TIME,
  closing_time    TIME,
  delivery_time   INT DEFAULT 30,           -- minutes
  min_order       DECIMAL(10, 2) DEFAULT 0,
  delivery_fee    DECIMAL(10, 2) DEFAULT 0,
  is_open         BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  avg_rating      DECIMAL(3, 2) DEFAULT 0,
  total_reviews   INT DEFAULT 0,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_owner    ON restaurants(owner_id);
CREATE INDEX idx_restaurants_city     ON restaurants(city);
CREATE INDEX idx_restaurants_open     ON restaurants(is_open);
CREATE INDEX idx_restaurants_featured ON restaurants(is_featured);
CREATE INDEX idx_restaurants_location ON restaurants USING BTREE(latitude, longitude);
CREATE INDEX idx_restaurants_name_trgm ON restaurants USING GIN(name gin_trgm_ops);
CREATE INDEX idx_restaurants_cuisine  ON restaurants USING GIN(cuisine_type);

-- ============================================================
-- RESTAURANT IMAGES
-- ============================================================

CREATE TABLE restaurant_images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  caption       TEXT,
  is_primary    BOOLEAN DEFAULT FALSE,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurant_images_restaurant ON restaurant_images(restaurant_id);

-- ============================================================
-- MENU CATEGORIES
-- ============================================================

CREATE TABLE menu_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_categories_restaurant ON menu_categories(restaurant_id);

-- ============================================================
-- MENU ITEMS
-- ============================================================

CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  price           DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  discounted_price DECIMAL(10, 2) CHECK (discounted_price >= 0),
  image_url       TEXT,
  ingredients     TEXT[],
  allergens       TEXT[],
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_vegetarian   BOOLEAN DEFAULT FALSE,
  is_vegan        BOOLEAN DEFAULT FALSE,
  is_spicy        BOOLEAN DEFAULT FALSE,
  preparation_time INT DEFAULT 15,
  calories        INT,
  avg_rating      DECIMAL(3, 2) DEFAULT 0,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_restaurant  ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category    ON menu_items(category_id);
CREATE INDEX idx_menu_items_available   ON menu_items(is_available);
CREATE INDEX idx_menu_items_featured    ON menu_items(is_featured);
CREATE INDEX idx_menu_items_name_trgm   ON menu_items USING GIN(name gin_trgm_ops);

-- ============================================================
-- DELIVERY ADDRESSES
-- ============================================================

CREATE TABLE delivery_addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label         TEXT DEFAULT 'Home',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  state         TEXT,
  postal_code   TEXT,
  country       TEXT DEFAULT 'UAE',
  latitude      DECIMAL(10, 8),
  longitude     DECIMAL(11, 8),
  is_default    BOOLEAN DEFAULT FALSE,
  instructions  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_addresses_user ON delivery_addresses(user_id);

-- ============================================================
-- CARTS
-- ============================================================

CREATE TABLE carts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  promo_code    TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_carts_user       ON carts(user_id);
CREATE INDEX idx_carts_restaurant ON carts(restaurant_id);

-- ============================================================
-- CART ITEMS
-- ============================================================

CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id     UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(10, 2) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart      ON cart_items(cart_id);
CREATE INDEX idx_cart_items_menu_item ON cart_items(menu_item_id);

-- ============================================================
-- PROMO CODES
-- ============================================================

CREATE TABLE promo_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  DECIMAL(10, 2) NOT NULL,
  min_order_value DECIMAL(10, 2) DEFAULT 0,
  max_discount    DECIMAL(10, 2),
  usage_limit     INT,
  used_count      INT DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      TEXT NOT NULL UNIQUE,
  customer_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  restaurant_id     UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  rider_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  delivery_address_id UUID REFERENCES delivery_addresses(id) ON DELETE SET NULL,
  status            order_status NOT NULL DEFAULT 'pending',
  subtotal          DECIMAL(10, 2) NOT NULL,
  delivery_fee      DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount        DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount   DECIMAL(10, 2) DEFAULT 0,
  total_amount      DECIMAL(10, 2) NOT NULL,
  promo_code        TEXT,
  payment_method    payment_method_type,
  payment_status    payment_status NOT NULL DEFAULT 'pending',
  special_instructions TEXT,
  estimated_delivery_time TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  prepared_at       TIMESTAMPTZ,
  picked_up_at      TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer    ON orders(customer_id);
CREATE INDEX idx_orders_restaurant  ON orders(restaurant_id);
CREATE INDEX idx_orders_rider       ON orders(rider_id);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_payment     ON orders(payment_status);
CREATE INDEX idx_orders_created     ON orders(created_at DESC);
CREATE INDEX idx_orders_number      ON orders(order_number);

-- Order number sequence function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'FX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_seq START 1;

CREATE TRIGGER set_order_number
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  unit_price    DECIMAL(10, 2) NOT NULL,
  total_price   DECIMAL(10, 2) NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order     ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  stripe_payment_intent_id TEXT UNIQUE,
  amount              DECIMAL(10, 2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'usd',
  method              payment_method_type NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  refund_amount       DECIMAL(10, 2) DEFAULT 0,
  refund_reason       TEXT,
  stripe_refund_id    TEXT,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order  ON payments(order_id);
CREATE INDEX idx_payments_user   ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

-- ============================================================
-- RIDERS
-- ============================================================

CREATE TABLE riders (
  id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type    TEXT DEFAULT 'motorcycle',
  vehicle_number  TEXT,
  license_number  TEXT,
  status          rider_status NOT NULL DEFAULT 'offline',
  is_verified     BOOLEAN DEFAULT FALSE,
  total_deliveries INT DEFAULT 0,
  avg_rating      DECIMAL(3, 2) DEFAULT 0,
  earnings_today  DECIMAL(10, 2) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_riders_status ON riders(status);

-- ============================================================
-- RIDER LOCATIONS
-- ============================================================

CREATE TABLE rider_locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude    DECIMAL(10, 8) NOT NULL,
  longitude   DECIMAL(11, 8) NOT NULL,
  heading     DECIMAL(5, 2),
  speed       DECIMAL(5, 2),
  accuracy    DECIMAL(8, 4),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rider_id)
);

CREATE INDEX idx_rider_locations_rider    ON rider_locations(rider_id);
CREATE INDEX idx_rider_locations_location ON rider_locations USING BTREE(latitude, longitude);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  food_rating     INT NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
  delivery_rating INT CHECK (delivery_rating BETWEEN 1 AND 5),
  overall_rating  INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  comment         TEXT,
  images          TEXT[],
  is_verified     BOOLEAN DEFAULT TRUE,
  helpful_count   INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id)
);

CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX idx_reviews_customer   ON reviews(customer_id);
CREATE INDEX idx_reviews_rating     ON reviews(overall_rating);

-- Update restaurant avg_rating on review insert/update
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE restaurants SET
    avg_rating = (SELECT AVG(overall_rating) FROM reviews WHERE restaurant_id = NEW.restaurant_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = NEW.restaurant_id),
    updated_at = NOW()
  WHERE id = NEW.restaurant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_restaurant_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_restaurant_rating();

-- ============================================================
-- FAVORITES
-- ============================================================

CREATE TABLE favorites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_item_id  UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (restaurant_id IS NOT NULL AND menu_item_id IS NULL) OR
    (restaurant_id IS NULL AND menu_item_id IS NOT NULL)
  ),
  UNIQUE(user_id, restaurant_id),
  UNIQUE(user_id, menu_item_id)
);

CREATE INDEX idx_favorites_user       ON favorites(user_id);
CREATE INDEX idx_favorites_restaurant ON favorites(restaurant_id);
CREATE INDEX idx_favorites_menu_item  ON favorites(menu_item_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  is_read     BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user   ON notifications(user_id);
CREATE INDEX idx_notifications_read   ON notifications(is_read);
CREATE INDEX idx_notifications_type   ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_riders_updated_at
  BEFORE UPDATE ON riders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_delivery_addresses_updated_at
  BEFORE UPDATE ON delivery_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
