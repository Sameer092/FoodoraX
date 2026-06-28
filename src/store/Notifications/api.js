import { supabase, removeChannel } from '@library/supabase';

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(userId) {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return count || 0;
}

export async function markAsRead(id) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllAsRead(userId) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export function subscribeToNotifications(userId, callback) {
  const name = `notifications-${userId}`;
  supabase.getChannels().filter((c) => c.topic === `realtime:${name}`).forEach((c) => removeChannel(c));
  const channel = supabase.channel(name);
  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => callback(payload.new))
    .subscribe();
  return channel;
}
