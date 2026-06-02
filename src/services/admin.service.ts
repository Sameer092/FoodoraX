import { supabase } from './supabase';
import type { Restaurant, Rider, User, PlatformSettings } from '@types/index';

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

  // ─── Dashboard stats ────────────────────────────────────────
  async getStats() {
    const [restaurants, riders, orders, users] = await Promise.all([
      supabase.from('restaurants').select('id, is_verified', { count: 'exact' }),
      supabase.from('riders').select('id, is_verified', { count: 'exact' }),
      supabase.from('orders').select('id, total_amount, status', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ]);

    const restaurantRows = (restaurants.data ?? []) as { is_verified: boolean }[];
    const riderRows = (riders.data ?? []) as { is_verified: boolean }[];
    const orderRows = (orders.data ?? []) as { total_amount: number; status: string }[];

    const gmv = orderRows
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    return {
      totalRestaurants: restaurants.count ?? 0,
      pendingRestaurants: restaurantRows.filter((r) => !r.is_verified).length,
      totalRiders: riders.count ?? 0,
      pendingRiders: riderRows.filter((r) => !r.is_verified).length,
      totalOrders: orders.count ?? 0,
      totalUsers: users.count ?? 0,
      gmv,
    };
  },
};
