import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@services/notification.service';
import { useAuthStore } from '@store/auth.store';
import { useAppStore } from '@store/app.store';
import type { Notification } from '@types/index';

export function useNotifications() {
  const { user } = useAuthStore();
  const { setUnreadNotifications } = useAppStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const result = await notificationService.getNotifications(user!.id);
      const unread = await notificationService.getUnreadCount(user!.id);
      setUnreadNotifications(unread);
      return result;
    },
    enabled: !!user,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = notificationService.subscribeToNotifications(user.id, (n: Notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      setUnreadNotifications((prev: number) => prev + 1);
    });
    return () => { channel.unsubscribe(); };
  }, [user, queryClient, setUnreadNotifications]);

  useEffect(() => {
    const sub = notificationService.addNotificationReceivedListener((notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    });
    return () => sub.remove();
  }, [user, queryClient]);

  return query;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { decrementUnread } = useAppStore();

  return async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    decrementUnread();
  };
}
