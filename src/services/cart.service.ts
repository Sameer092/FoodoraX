import { supabase } from './supabase';
import type { Cart, CartItem, PromoCode } from '@types/index';

export const cartService = {
  async getCart(userId: string): Promise<Cart | null> {
    const { data, error } = await supabase
      .from('carts')
      .select(`
        *,
        restaurant:restaurants(id, name, logo_url, delivery_fee, min_order),
        items:cart_items(*, menu_item:menu_items(id, name, price, image_url, is_available))
      `)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Cart | null;
  },

  async createCart(userId: string, restaurantId: string): Promise<Cart> {
    const { data, error } = await supabase
      .from('carts')
      .insert({ user_id: userId, restaurant_id: restaurantId })
      .select()
      .single();
    if (error) throw error;
    return data as Cart;
  },

  async clearCart(userId: string) {
    const cart = await cartService.getCart(userId);
    if (!cart) return;
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    await supabase.from('carts').delete().eq('id', cart.id);
  },

  async addItem(cartId: string, menuItemId: string, unitPrice: number, notes?: string): Promise<CartItem> {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('menu_item_id', menuItemId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data as CartItem;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert({ cart_id: cartId, menu_item_id: menuItemId, quantity: 1, unit_price: unitPrice, notes })
      .select()
      .single();
    if (error) throw error;
    return data as CartItem;
  },

  async updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      await supabase.from('cart_items').delete().eq('id', itemId);
      return null;
    }
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return data as CartItem;
  },

  async removeItem(itemId: string) {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  async validatePromoCode(code: string, orderTotal: number): Promise<PromoCode> {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();
    if (error || !data) throw new Error('Invalid promo code');

    const promo = data as PromoCode;
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      throw new Error('Promo code has expired');
    }
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      throw new Error('Promo code usage limit reached');
    }
    if (orderTotal < promo.min_order_value) {
      throw new Error(`Minimum order of $${promo.min_order_value} required`);
    }
    return promo;
  },

  calculateDiscount(promo: PromoCode, subtotal: number): number {
    if (promo.discount_type === 'percentage') {
      const discount = subtotal * (promo.discount_value / 100);
      return promo.max_discount ? Math.min(discount, promo.max_discount) : discount;
    }
    return Math.min(promo.discount_value, subtotal);
  },
};
