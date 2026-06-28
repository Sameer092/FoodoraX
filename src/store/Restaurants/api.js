import { supabase } from '@library/supabase';
import { DEFAULT_PAGE_SIZE } from '@config/constant';
import { calculateDistance } from '@library/location';

export async function getRestaurants(filters = {}) {
  const { query, cuisine, sortBy = 'avg_rating', page = 0, pageSize = DEFAULT_PAGE_SIZE } = filters;

  let q = supabase
    .from('restaurants')
    .select('*, images:restaurant_images(url, is_primary)', { count: 'exact' })
    .eq('is_verified', true);

  if (query) q = q.ilike('name', `%${query}%`);
  if (cuisine) q = q.overlaps('cuisine_type', [cuisine]);

  q = q.order(sortBy, { ascending: sortBy === 'delivery_time' || sortBy === 'delivery_fee' }).range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data: data || [], count: count || 0, page, hasMore: (count || 0) > (page + 1) * pageSize };
}

export async function getFeatured() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, images:restaurant_images(url, is_primary)')
    .eq('is_featured', true)
    .eq('is_open', true)
    .eq('is_verified', true)
    .order('avg_rating', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}

export async function getNearby(lat, lon, radiusKm = 10) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, images:restaurant_images(url, is_primary)')
    .eq('is_open', true)
    .eq('is_verified', true)
    .not('latitude', 'is', null);
  if (error) throw error;
  return (data || []).filter((r) => r.latitude && calculateDistance({ latitude: lat, longitude: lon }, { latitude: r.latitude, longitude: r.longitude }) <= radiusKm);
}

export async function getById(id) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, images:restaurant_images(*), categories:menu_categories(*, items:menu_items(*))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getByOwner(ownerId) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, images:restaurant_images(url, is_primary)')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createRestaurant(payload) {
  const { data, error } = await supabase.from('restaurants').insert(payload).select().single();
  if (error) throw error;
  await supabase.from('menu_categories').insert({ restaurant_id: data.id, name: 'Main Menu', sort_order: 0 });
  return data;
}

export async function updateRestaurant(id, updates) {
  const { data, error } = await supabase.from('restaurants').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function createMenuItem(item) {
  const { data, error } = await supabase.from('menu_items').insert(item).select().single();
  if (error) throw error;
  return data;
}

export async function updateMenuItem(id, updates) {
  const { data, error } = await supabase.from('menu_items').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

export async function getReviews(restaurantId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, customer:users(full_name, avatar_url)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getReviewByOrder(orderId) {
  const { data } = await supabase.from('reviews').select('*').eq('order_id', orderId).maybeSingle();
  return data;
}

export async function createReview(review) {
  const { data, error } = await supabase.from('reviews').insert(review).select().single();
  if (error) throw error;
  return data;
}

export async function getFavorites(userId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, restaurant:restaurants(*, images:restaurant_images(url, is_primary)), menu_item:menu_items(id, name, price, image_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function toggleFavorite(userId, restaurantId) {
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();
  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id);
    return false;
  }
  await supabase.from('favorites').insert({ user_id: userId, restaurant_id: restaurantId });
  return true;
}
