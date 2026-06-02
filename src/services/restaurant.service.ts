import { supabase } from './supabase';
import type { Restaurant, MenuCategory, MenuItem, Review, SearchFilters } from '@types/index';
import { Config } from '@constants/config';

export const restaurantService = {
  async getRestaurants(filters: SearchFilters = {}) {
    const {
      query, cuisineType, minRating, maxDeliveryTime,
      maxDeliveryFee, isOpen, isFeatured,
      sortBy = 'rating', sortOrder = 'desc',
      page = 0, pageSize = Config.app.defaultPageSize,
    } = filters;

    let q = supabase
      .from('restaurants')
      .select('*, images:restaurant_images(url, is_primary)', { count: 'exact' })
      .eq('is_verified', true); // customers only see admin-approved restaurants

    if (query) q = q.ilike('name', `%${query}%`);
    if (cuisineType?.length) q = q.overlaps('cuisine_type', cuisineType);
    if (minRating) q = q.gte('avg_rating', minRating);
    if (maxDeliveryTime) q = q.lte('delivery_time', maxDeliveryTime);
    if (maxDeliveryFee !== undefined) q = q.lte('delivery_fee', maxDeliveryFee);
    if (isOpen !== undefined) q = q.eq('is_open', isOpen);
    if (isFeatured !== undefined) q = q.eq('is_featured', isFeatured);

    const sortCol = sortBy === 'rating' ? 'avg_rating'
      : sortBy === 'delivery_time' ? 'delivery_time'
      : sortBy === 'delivery_fee' ? 'delivery_fee'
      : 'name';

    q = q
      .order(sortCol, { ascending: sortOrder === 'asc' })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, error, count } = await q;
    if (error) throw error;

    return {
      data: (data ?? []) as Restaurant[],
      count: count ?? 0,
      page,
      pageSize,
      hasMore: (count ?? 0) > (page + 1) * pageSize,
    };
  },

  async getFeaturedRestaurants(limit = 10) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, images:restaurant_images(url, is_primary)')
      .eq('is_featured', true)
      .eq('is_open', true)
      .eq('is_verified', true)
      .order('avg_rating', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Restaurant[];
  },

  async getNearbyRestaurants(lat: number, lon: number, radiusKm = 10, limit = 20) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, images:restaurant_images(url, is_primary)')
      .eq('is_open', true)
      .eq('is_verified', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(limit);
    if (error) throw error;

    const restaurants = ((data ?? []) as Restaurant[]).filter((r) => {
      if (!r.latitude || !r.longitude) return false;
      const dist = haversineDistance(lat, lon, r.latitude, r.longitude);
      return dist <= radiusKm;
    });
    return restaurants;
  },

  async getRestaurantById(id: string): Promise<Restaurant> {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        images:restaurant_images(*),
        categories:menu_categories(*, items:menu_items(*))
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Restaurant;
  },

  async getRestaurantsByOwner(ownerId: string) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, images:restaurant_images(url, is_primary)')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Restaurant[];
  },

  async createRestaurant(payload: Omit<Restaurant, 'id' | 'avg_rating' | 'total_reviews' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('restaurants')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Restaurant;
  },

  async updateRestaurant(id: string, updates: Partial<Restaurant>) {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Restaurant;
  },

  // ─── Menu ───────────────────────────────────────────────────

  async getMenuCategories(restaurantId: string) {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*, items:menu_items(*)')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []) as MenuCategory[];
  },

  async createMenuItem(item: Omit<MenuItem, 'id' | 'avg_rating' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('menu_items').insert(item).select().single();
    if (error) throw error;
    return data as MenuItem;
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MenuItem;
  },

  async deleteMenuItem(id: string) {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Reviews ────────────────────────────────────────────────

  async getReviews(restaurantId: string, page = 0, pageSize = 10) {
    const { data, error, count } = await supabase
      .from('reviews')
      .select('*, customer:users(full_name, avatar_url)', { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    return {
      data: (data ?? []) as Review[],
      count: count ?? 0,
      hasMore: (count ?? 0) > (page + 1) * pageSize,
    };
  },

  async createReview(review: Omit<Review, 'id' | 'is_verified' | 'helpful_count' | 'created_at'>) {
    const { data, error } = await supabase.from('reviews').insert(review).select().single();
    if (error) throw error;
    return data as Review;
  },

  // ─── Image Upload ────────────────────────────────────────────

  async uploadRestaurantImage(restaurantId: string, file: { uri: string; name: string; type: string }) {
    const path = `restaurants/${restaurantId}/${Date.now()}_${file.name}`;
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(Config.storage.buckets.restaurants)
      .upload(path, blob, { contentType: file.type, upsert: false });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(Config.storage.buckets.restaurants)
      .getPublicUrl(data.path);

    return publicUrl;
  },
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) { return deg * (Math.PI / 180); }
