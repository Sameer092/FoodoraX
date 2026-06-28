import { supabase, removeChannel } from '@library/supabase';

export async function getMessages(orderId) {
  const { data, error } = await supabase
    .from('order_messages')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendMessage(orderId, senderId, message) {
  const { data, error } = await supabase
    .from('order_messages')
    .insert({ order_id: orderId, sender_id: senderId, message: message.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function subscribeToMessages(orderId, callback) {
  const name = `order-chat-${orderId}`;
  supabase.getChannels().filter((c) => c.topic === `realtime:${name}`).forEach((c) => removeChannel(c));
  const channel = supabase.channel(name);
  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${orderId}` }, (payload) => callback(payload.new))
    .subscribe();
  return channel;
}
