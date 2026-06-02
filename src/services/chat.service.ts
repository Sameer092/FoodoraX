import { supabase } from './supabase';

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export const chatService = {
  async getMessages(orderId: string): Promise<OrderMessage[]> {
    const { data, error } = await supabase
      .from('order_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as OrderMessage[];
  },

  async sendMessage(orderId: string, senderId: string, message: string): Promise<OrderMessage> {
    const { data, error } = await supabase
      .from('order_messages')
      .insert({ order_id: orderId, sender_id: senderId, message: message.trim() })
      .select()
      .single();
    if (error) throw error;
    return data as OrderMessage;
  },

  subscribeToMessages(orderId: string, callback: (msg: OrderMessage) => void) {
    const name = `order-chat-${orderId}`;
    supabase.getChannels()
      .filter((c) => c.topic === `realtime:${name}`)
      .forEach((c) => supabase.removeChannel(c));
    const channel = supabase.channel(name);
    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${orderId}` },
        (payload) => callback(payload.new as OrderMessage)
      )
      .subscribe();
    return channel;
  },
};
