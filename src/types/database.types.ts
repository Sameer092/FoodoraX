export type UserRole = 'customer' | 'restaurant_owner' | 'rider' | 'admin';
export type OrderStatus =
  | 'pending' | 'accepted' | 'preparing' | 'ready'
  | 'picked_up' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay' | 'cash';
export type RiderStatus = 'offline' | 'online' | 'busy';
export type NotificationType =
  | 'order_accepted' | 'order_preparing' | 'order_ready'
  | 'rider_assigned' | 'rider_nearby' | 'order_delivered'
  | 'order_cancelled' | 'promotion' | 'system';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  push_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  cuisine_type?: string[];
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  logo_url?: string;
  cover_url?: string;
  opening_time?: string;
  closing_time?: string;
  delivery_time: number;
  min_order: number;
  delivery_fee: number;
  is_open: boolean;
  is_featured: boolean;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  images?: RestaurantImage[];
  categories?: MenuCategory[];
}

export interface RestaurantImage {
  id: string;
  restaurant_id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  items?: MenuItem[];
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  discounted_price?: number;
  image_url?: string;
  ingredients?: string[];
  allergens?: string[];
  is_available: boolean;
  is_featured: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  preparation_time: number;
  calories?: number;
  avg_rating: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  restaurant_id: string;
  promo_code?: string;
  discount_amount: number;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
  restaurant?: Restaurant;
}

export interface CartItem {
  id: string;
  cart_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  menu_item?: MenuItem;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  restaurant_id: string;
  rider_id?: string;
  delivery_address_id?: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  promo_code?: string;
  payment_method?: PaymentMethodType;
  payment_status: PaymentStatus;
  special_instructions?: string;
  estimated_delivery_time?: string;
  accepted_at?: string;
  prepared_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  customer?: User;
  restaurant?: Restaurant;
  rider?: User;
  items?: OrderItem[];
  delivery_address?: DeliveryAddress;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
  menu_item?: MenuItem;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  status: PaymentStatus;
  refund_amount?: number;
  refund_reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Rider {
  id: string;
  vehicle_type: string;
  vehicle_number?: string;
  license_number?: string;
  status: RiderStatus;
  is_verified: boolean;
  total_deliveries: number;
  avg_rating: number;
  earnings_today: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface RiderLocation {
  id: string;
  rider_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  restaurant_id: string;
  food_rating: number;
  delivery_rating?: number;
  overall_rating: number;
  comment?: string;
  images?: string[];
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  customer?: User;
}

export interface Favorite {
  id: string;
  user_id: string;
  restaurant_id?: string;
  menu_item_id?: string;
  created_at: string;
  restaurant?: Restaurant;
  menu_item?: MenuItem;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  sent_at?: string;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}
