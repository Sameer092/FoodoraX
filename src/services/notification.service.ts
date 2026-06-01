import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import type { Notification, NotificationType } from '@types/index';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) return null;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FoodoraX Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  },

  async getNotifications(userId: string, page = 0, pageSize = 20) {
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    return {
      data: (data ?? []) as Notification[],
      count: count ?? 0,
      hasMore: (count ?? 0) > (page + 1) * pageSize,
    };
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count ?? 0;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async sendPushNotification(params: {
    pushToken: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: params.pushToken,
        sound: 'default',
        title: params.title,
        body: params.body,
        data: params.data ?? {},
      }),
    });
  },

  async createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as Notification;
  },

  subscribeToNotifications(userId: string, callback: (n: Notification) => void) {
    return supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callback(payload.new as Notification)
      )
      .subscribe();
  },

  addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  addNotificationReceivedListener(handler: (n: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  },
};
