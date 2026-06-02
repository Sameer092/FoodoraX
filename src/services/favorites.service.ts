import { supabase } from './supabase';
import type { Favorite } from '@types/index';

export const favoritesService = {
  async getFavorites(userId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        restaurant:restaurants(*, images:restaurant_images(url, is_primary)),
        menu_item:menu_items(id, name, price, image_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Favorite[];
  },

  async toggleFavoriteRestaurant(userId: string, restaurantId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      return false;
    }

    await supabase.from('favorites').insert({ user_id: userId, restaurant_id: restaurantId });
    return true;
  },

  async toggleFavoriteMenuItem(userId: string, menuItemId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('menu_item_id', menuItemId)
      .single();

    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      return false;
    }

    await supabase.from('favorites').insert({ user_id: userId, menu_item_id: menuItemId });
    return true;
  },

  async isFavoriteRestaurant(userId: string, restaurantId: string): Promise<boolean> {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .single();
    return !!data;
  },
};
