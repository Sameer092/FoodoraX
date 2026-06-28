import { supabase } from '@library/supabase';

export async function getAllRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, owner:users!restaurants_owner_id_fkey(full_name, email, phone)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function setRestaurantVerified(id, verified) {
  const { error } = await supabase.from('restaurants').update({ is_verified: verified }).eq('id', id);
  if (error) throw error;
}

export async function getAllRiders() {
  const { data, error } = await supabase
    .from('riders')
    .select('*, user:users!riders_id_fkey(full_name, email, phone, avatar_url)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function setRiderVerified(id, verified) {
  const { error } = await supabase.from('riders').update({ is_verified: verified }).eq('id', id);
  if (error) throw error;
}

export async function getAllUsers() {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customer:users!orders_customer_id_fkey(full_name), rider:users!orders_rider_id_fkey(full_name), restaurant:restaurants(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function cancelOrder(orderId, reason, wasPaid) {
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
}

export async function getSettings() {
  const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

export async function updateSettings(updates) {
  const { data, error } = await supabase
    .from('platform_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getStats() {
  const [restaurants, riders, orders, users, settings] = await Promise.all([
    supabase.from('restaurants').select('id, is_verified', { count: 'exact' }),
    supabase.from('riders').select('id, is_verified', { count: 'exact' }),
    supabase.from('orders').select('id, total_amount, subtotal, status', { count: 'exact' }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('platform_settings').select('platform_commission').eq('id', 1).maybeSingle(),
  ]);

  const restaurantRows = restaurants.data || [];
  const riderRows = riders.data || [];
  const orderRows = orders.data || [];
  const commissionPct = Number((settings.data && settings.data.platform_commission) || 15);
  const delivered = orderRows.filter((o) => o.status === 'delivered');

  return {
    totalRestaurants: restaurants.count || 0,
    pendingRestaurants: restaurantRows.filter((r) => !r.is_verified).length,
    totalRiders: riders.count || 0,
    pendingRiders: riderRows.filter((r) => !r.is_verified).length,
    totalOrders: orders.count || 0,
    totalUsers: users.count || 0,
    gmv: delivered.reduce((s, o) => s + Number(o.total_amount), 0),
    revenue: delivered.reduce((s, o) => s + Number(o.subtotal || 0) * (commissionPct / 100), 0),
    commissionPct,
  };
}
