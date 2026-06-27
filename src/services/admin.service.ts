import { supabase } from './supabase';
import type { Restaurant, Rider, User, PlatformSettings, Order } from '@types/index';

export const adminService = {
  // ─── Restaurants ────────────────────────────────────────────
  async getAllRestaurants() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, owner:users!restaurants_owner_id_fkey(full_name, email, phone)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as (Restaurant & { owner?: User })[];
  },

  async setRestaurantVerified(restaurantId: string, verified: boolean) {
    const { error } = await supabase
      .from('restaurants')
      .update({ is_verified: verified })
      .eq('id', restaurantId);
    if (error) throw error;
  },

  // ─── Riders ─────────────────────────────────────────────────
  async getAllRiders() {
    const { data, error } = await supabase
      .from('riders')
      .select('*, user:users!riders_id_fkey(full_name, email, phone, avatar_url)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as (Rider & { user?: User })[];
  },

  async setRiderVerified(riderId: string, verified: boolean) {
    const { error } = await supabase
      .from('riders')
      .update({ is_verified: verified })
      .eq('id', riderId);
    if (error) throw error;
  },

  // ─── Users ──────────────────────────────────────────────────
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as User[];
  },

  async setUserActive(userId: string, isActive: boolean) {
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId);
    if (error) throw error;
  },

  // ─── Platform Settings (rider pay, commission) ──────────────
  async getSettings(): Promise<PlatformSettings> {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (error) throw error;
    return data as PlatformSettings;
  },

  async updateSettings(updates: Partial<PlatformSettings>) {
    const { data, error } = await supabase
      .from('platform_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    return data as PlatformSettings;
  },

  // ─── All Orders (platform-wide) ─────────────────────────────
  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(full_name),
        rider:users!orders_rider_id_fkey(full_name),
        restaurant:restaurants(name)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Order[];
  },

  // Admin cancels an order (e.g. a stale/stuck one). Marks it cancelled and,
  // if it was paid, flags the payment as refunded.
  async cancelOrder(orderId: string, reason: string, wasPaid: boolean) {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        ...(wasPaid ? { payment_status: 'refunded' } : {}),
      })
      .eq('id', orderId);
    if (error) throw error;
  },

  // ─── Dashboard stats ────────────────────────────────────────
  async getStats() {
    const [restaurants, riders, orders, users, settings] = await Promise.all([
      supabase.from('restaurants').select('id, is_verified', { count: 'exact' }),
      supabase.from('riders').select('id, is_verified', { count: 'exact' }),
      supabase.from('orders').select('id, total_amount, subtotal, delivery_fee, rider_payout, status', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('platform_settings').select('platform_commission').eq('id', 1).maybeSingle(),
    ]);

    const restaurantRows = (restaurants.data ?? []) as { is_verified: boolean }[];
    const riderRows = (riders.data ?? []) as { is_verified: boolean }[];
    const orderRows = (orders.data ?? []) as {
      total_amount: number; subtotal: number; rider_payout: number; status: string;
    }[];

    const commissionPct = Number((settings.data as any)?.platform_commission ?? 15);
    const delivered = orderRows.filter((o) => o.status === 'delivered');

    const gmv = delivered.reduce((sum, o) => sum + Number(o.total_amount), 0);
    // Platform revenue = commission% of the food subtotal across delivered orders
    const revenue = delivered.reduce(
      (sum, o) => sum + Number(o.subtotal ?? 0) * (commissionPct / 100),
      0,
    );
    const riderPayouts = delivered.reduce((sum, o) => sum + Number(o.rider_payout ?? 0), 0);

    return {
      totalRestaurants: restaurants.count ?? 0,
      pendingRestaurants: restaurantRows.filter((r) => !r.is_verified).length,
      totalRiders: riders.count ?? 0,
      pendingRiders: riderRows.filter((r) => !r.is_verified).length,
      totalOrders: orders.count ?? 0,
      totalUsers: users.count ?? 0,
      gmv,
      revenue,
      riderPayouts,
      commissionPct,
    };
  },
};
