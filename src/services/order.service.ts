import { supabase } from './supabase';
import type { Order, OrderStatus, CartItem } from '@types/index';
import { Config } from '@constants/config';

export interface CreateOrderPayload {
  customerId: string;
  restaurantId: string;
  cartItems: CartItem[];
  deliveryAddressId: string;
  paymentMethod: string;
  specialInstructions?: string;
  promoCode?: string;
  discountAmount?: number;
  deliveryFee: number;
}

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const subtotal = payload.cartItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity, 0
    );
    const taxAmount = subtotal * Config.app.taxRate;
    const totalAmount =
      subtotal + payload.deliveryFee + taxAmount - (payload.discountAmount ?? 0);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: payload.customerId,
        restaurant_id: payload.restaurantId,
        delivery_address_id: payload.deliveryAddressId,
        status: 'pending',
        subtotal,
        delivery_fee: payload.deliveryFee,
        tax_amount: taxAmount,
        discount_amount: payload.discountAmount ?? 0,
        total_amount: totalAmount,
        payment_method: payload.paymentMethod,
        promo_code: payload.promoCode,
        special_instructions: payload.specialInstructions,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const orderItems = payload.cartItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      name: item.menu_item?.name ?? 'Item',
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      notes: item.notes,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return order as Order;
  },

  async getOrderById(orderId: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, full_name, phone, avatar_url),
        restaurant:restaurants(id, name, address, phone, logo_url),
        rider:users!orders_rider_id_fkey(id, full_name, phone, avatar_url),
        items:order_items(*, menu_item:menu_items(id, name, image_url)),
        delivery_address:delivery_addresses(*)
      `)
      .eq('id', orderId)
      .single();
    if (error) throw error;
    return data as Order;
  },

  async getCustomerOrders(customerId: string, page = 0, pageSize = 20) {
    const { data, error, count } = await supabase
      .from('orders')
      .select(
        '*, restaurant:restaurants(id, name, logo_url), items:order_items(id, name, quantity)',
        { count: 'exact' }
      )
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    return {
      data: (data ?? []) as Order[],
      count: count ?? 0,
      hasMore: (count ?? 0) > (page + 1) * pageSize,
    };
  },

  async getRestaurantOrders(restaurantId: string, status?: OrderStatus) {
    let q = supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, full_name, phone),
        items:order_items(id, name, quantity)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (status) q = q.eq('status', status);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Order[];
  },

  async getOrdersByRestaurants(restaurantIds: string[]) {
    if (!restaurantIds.length) return [];
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, full_name, phone),
        restaurant:restaurants(id, name, logo_url),
        items:order_items(id, name, quantity)
      `)
      .in('restaurant_id', restaurantIds)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Order[];
  },

  async getAvailableDeliveries() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(id, name, address, latitude, longitude),
        delivery_address:delivery_addresses(address_line1, city, latitude, longitude)
      `)
      .eq('status', 'ready')
      .is('rider_id', null)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Order[];
  },

  async getRiderActiveDelivery(riderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, full_name, phone),
        restaurant:restaurants(id, name, address, latitude, longitude, phone),
        delivery_address:delivery_addresses(*),
        items:order_items(id, name, quantity, unit_price)
      `)
      .eq('rider_id', riderId)
      .in('status', ['accepted', 'preparing', 'ready', 'picked_up'])
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Order | null;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, updates: Partial<Order> = {}) {
    const timestamps: Partial<Order> = {};
    if (status === 'accepted')  timestamps.accepted_at = new Date().toISOString();
    if (status === 'preparing') timestamps.prepared_at = new Date().toISOString();
    if (status === 'picked_up') timestamps.picked_up_at = new Date().toISOString();
    if (status === 'delivered') timestamps.delivered_at = new Date().toISOString();
    if (status === 'cancelled') timestamps.cancelled_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update({ status, ...timestamps, ...updates })
      .eq('id', orderId)
      .select()
      .single();
    if (error) throw error;
    return data as Order;
  },

  async assignRider(orderId: string, riderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ rider_id: riderId, status: 'picked_up' })
      .eq('id', orderId)
      .select()
      .single();
    if (error) throw error;
    return data as Order;
  },

  subscribeToOrder(orderId: string, callback: (order: Order) => void) {
    const name = `order-${orderId}`;
    removeStaleChannel(name);
    const channel = supabase.channel(name);
    channel
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => callback(payload.new as Order)
      )
      .subscribe();
    return channel;
  },

  subscribeToRestaurantOrders(restaurantId: string, callback: (order: Order) => void) {
    const name = `restaurant-orders-${restaurantId}`;
    removeStaleChannel(name);
    const channel = supabase.channel(name);
    channel
      .on(
        'postgres_changes',
        {
          event: '*', schema: 'public', table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => callback(payload.new as Order)
      )
      .subscribe();
    return channel;
  },
};

// Removes any existing channel with the same name so we never call
// .on() on an already-subscribed channel (which Supabase forbids).
function removeStaleChannel(name: string) {
  supabase
    .getChannels()
    .filter((c) => c.topic === `realtime:${name}`)
    .forEach((c) => supabase.removeChannel(c));
}
