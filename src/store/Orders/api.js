import { supabase, removeChannel } from '@library/supabase';
import { TAX_RATE } from '@config/constant';

const STATUS_NOTIFICATIONS = {
  accepted: { type: 'order_accepted', title: 'Order Accepted', body: 'The restaurant accepted your order.' },
  preparing: { type: 'order_preparing', title: 'Preparing', body: 'Your food is being prepared.' },
  ready: { type: 'order_ready', title: 'Ready for Pickup', body: 'Your order is ready and waiting for a rider.' },
  picked_up: { type: 'rider_nearby', title: 'On the Way', body: 'Your rider has picked up your order.' },
  delivered: { type: 'order_delivered', title: 'Delivered', body: 'Your order has been delivered. Enjoy!' },
  cancelled: { type: 'order_cancelled', title: 'Order Cancelled', body: 'Your order was cancelled.' },
};

async function notifyCustomer(order, status) {
  const cfg = STATUS_NOTIFICATIONS[status];
  if (!cfg || !order || !order.customer_id) return;
  try {
    await supabase.from('notifications').insert({
      user_id: order.customer_id,
      type: cfg.type,
      title: cfg.title,
      body: `${cfg.body} (Order #${order.order_number})`,
      data: { orderId: order.id },
      sent_at: new Date().toISOString(),
    });
  } catch {
    // best effort
  }
}

export async function createOrder(payload) {
  const subtotal = payload.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + payload.deliveryFee + tax - (payload.discount || 0);

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_id: payload.customerId,
      restaurant_id: payload.restaurantId,
      delivery_address_id: payload.deliveryAddressId,
      status: 'pending',
      subtotal,
      delivery_fee: payload.deliveryFee,
      tax_amount: tax,
      discount_amount: payload.discount || 0,
      total_amount: total,
      payment_method: payload.paymentMethod,
      promo_code: payload.promoCode,
      special_instructions: payload.specialInstructions,
      estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  const orderItems = payload.items.map((i) => ({
    order_id: order.id,
    menu_item_id: i.menuItem.id,
    name: i.menuItem.name,
    quantity: i.quantity,
    unit_price: i.menuItem.price,
    total_price: i.menuItem.price * i.quantity,
  }));
  await supabase.from('order_items').insert(orderItems);
  return order;
}

export async function getById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:users!orders_customer_id_fkey(id, full_name, phone, avatar_url),
      restaurant:restaurants(id, name, address, phone, logo_url, latitude, longitude),
      rider:users!orders_rider_id_fkey(id, full_name, phone, avatar_url),
      items:order_items(*, menu_item:menu_items(id, name, image_url)),
      delivery_address:delivery_addresses(*)
    `)
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data;
}

export async function getCustomerOrders(customerId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, restaurant:restaurants(id, name, logo_url), items:order_items(id, name, quantity)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOrdersByRestaurants(restaurantIds) {
  if (!restaurantIds.length) return [];
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:users!orders_customer_id_fkey(id, full_name, phone),
      rider:users!orders_rider_id_fkey(id, full_name, phone),
      restaurant:restaurants(id, name, logo_url),
      items:order_items(id, name, quantity)
    `)
    .in('restaurant_id', restaurantIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAvailableDeliveries() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, restaurant:restaurants(id, name, address, latitude, longitude), delivery_address:delivery_addresses(address_line1, city, latitude, longitude)')
    .eq('status', 'ready')
    .is('rider_id', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getRiderActiveDelivery(riderId) {
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
    .in('status', ['ready', 'picked_up'])
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateStatus(orderId, status, updates = {}) {
  const timestamps = {};
  if (status === 'accepted') timestamps.accepted_at = new Date().toISOString();
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
  await notifyCustomer(data, status);
  return data;
}

export async function assignRider(orderId, riderId) {
  const { data, error } = await supabase
    .from('orders')
    .update({ rider_id: riderId })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  if (data && data.customer_id) {
    await supabase.from('notifications').insert({
      user_id: data.customer_id,
      type: 'rider_assigned',
      title: 'Rider Assigned',
      body: `A rider is heading to pick up order #${data.order_number}.`,
      data: { orderId },
      sent_at: new Date().toISOString(),
    });
  }
  return data;
}

export async function validatePromo(code, subtotal) {
  const { data } = await supabase.from('promo_codes').select('*').eq('code', code.toUpperCase()).eq('is_active', true).maybeSingle();
  if (!data) throw new Error('Invalid promo code');
  if (data.expires_at && new Date(data.expires_at) < new Date()) throw new Error('Promo code expired');
  if (subtotal < data.min_order_value) throw new Error(`Minimum order of $${data.min_order_value} required`);
  return data;
}

export function calculateDiscount(promo, subtotal) {
  if (promo.discount_type === 'percentage') {
    const d = subtotal * (promo.discount_value / 100);
    return promo.max_discount ? Math.min(d, promo.max_discount) : d;
  }
  return Math.min(promo.discount_value, subtotal);
}

export function subscribeToOrder(orderId, callback) {
  const name = `order-${orderId}`;
  supabase.getChannels().filter((c) => c.topic === `realtime:${name}`).forEach((c) => removeChannel(c));
  const channel = supabase.channel(name);
  channel
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => callback(payload.new))
    .subscribe();
  return channel;
}

export function subscribeToRestaurantOrders(restaurantId, callback) {
  const name = `restaurant-orders-${restaurantId}`;
  supabase.getChannels().filter((c) => c.topic === `realtime:${name}`).forEach((c) => removeChannel(c));
  const channel = supabase.channel(name);
  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, (payload) => callback(payload.new))
    .subscribe();
  return channel;
}
