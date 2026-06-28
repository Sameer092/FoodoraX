import { supabase } from '@library/supabase';

export async function createAddress(payload) {
  const { data, error } = await supabase.from('delivery_addresses').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function getProfileStats(user) {
  if (!user) return [];

  if (user.role === 'customer') {
    const [orders, favs, reviews] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', user.id),
      supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('customer_id', user.id),
    ]);
    return [
      { label: 'Orders', value: String(orders.count || 0) },
      { label: 'Favorites', value: String(favs.count || 0) },
      { label: 'Reviews', value: String(reviews.count || 0) },
    ];
  }

  if (user.role === 'rider') {
    const [{ data: rider }, { data: delivered }] = await Promise.all([
      supabase.from('riders').select('avg_rating').eq('id', user.id).maybeSingle(),
      supabase.from('orders').select('rider_payout').eq('rider_id', user.id).eq('status', 'delivered'),
    ]);
    const rows = delivered || [];
    const earnings = rows.reduce((s, o) => s + Number(o.rider_payout || 0), 0);
    return [
      { label: 'Deliveries', value: String(rows.length) },
      { label: 'Earnings', value: `$${earnings.toFixed(0)}` },
      { label: 'Rating', value: Number((rider && rider.avg_rating) || 0).toFixed(1) },
    ];
  }

  if (user.role === 'restaurant_owner') {
    const { data: rests } = await supabase.from('restaurants').select('id').eq('owner_id', user.id);
    const ids = (rests || []).map((r) => r.id);
    let orderCount = 0;
    let earnings = 0;
    let rating = 0;
    if (ids.length) {
      const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).in('restaurant_id', ids);
      orderCount = count || 0;
      const { data: delivered } = await supabase.from('orders').select('total_amount').in('restaurant_id', ids).eq('status', 'delivered');
      earnings = (delivered || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const { data: reviews } = await supabase.from('reviews').select('overall_rating').in('restaurant_id', ids);
      const rows = reviews || [];
      rating = rows.length ? rows.reduce((s, r) => s + Number(r.overall_rating || 0), 0) / rows.length : 0;
    }
    return [
      { label: 'Orders', value: String(orderCount) },
      { label: 'Earnings', value: `$${earnings.toFixed(0)}` },
      { label: 'Rating', value: rating.toFixed(1) },
    ];
  }

  return [];
}

export async function getRiderToday(riderId) {
  const [{ data: rider }, { data: delivered }] = await Promise.all([
    supabase.from('riders').select('avg_rating, is_verified').eq('id', riderId).maybeSingle(),
    supabase.from('orders').select('rider_payout, delivered_at').eq('rider_id', riderId).eq('status', 'delivered'),
  ]);
  const rows = delivered || [];
  const today = new Date().toDateString();
  const todayRows = rows.filter((o) => o.delivered_at && new Date(o.delivered_at).toDateString() === today);
  return {
    isVerified: !!(rider && rider.is_verified),
    rating: Number((rider && rider.avg_rating) || 0),
    todayCount: todayRows.length,
    todayEarnings: todayRows.reduce((s, o) => s + Number(o.rider_payout || 0), 0),
  };
}

export async function getRiderEarnings(riderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, rider_payout, delivered_at')
    .eq('rider_id', riderId)
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
