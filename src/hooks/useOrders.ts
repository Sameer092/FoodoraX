import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { orderService, CreateOrderPayload } from '@services/order.service';
import { supabase } from '@services/supabase';
import { useAuthStore } from '@store/auth.store';
import type { OrderStatus } from '@types/index';

export const orderKeys = {
  all: ['orders'] as const,
  customer: (id: string) => ['orders', 'customer', id] as const,
  restaurant: (id: string) => ['orders', 'restaurant', id] as const,
  available: () => ['orders', 'available'] as const,
  riderActive: (id: string) => ['orders', 'rider', 'active', id] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
};

export function useCustomerOrders() {
  const { user } = useAuthStore();
  return useInfiniteQuery({
    queryKey: orderKeys.customer(user?.id ?? ''),
    queryFn: ({ pageParam = 0 }) =>
      orderService.getCustomerOrders(user!.id, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last, allPages) => (last.hasMore ? allPages.length : undefined),
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
    refetchInterval: 30 * 1000,
  });
}

export function useOrderWithRealtime(orderId: string) {
  const queryClient = useQueryClient();
  const query = useOrder(orderId);

  useEffect(() => {
    if (!orderId) return;
    const channel = orderService.subscribeToOrder(orderId, (updated) => {
      // Realtime sends only the bare order row (no joined customer/restaurant/
      // items/address). MERGE the changed fields into the existing cached order
      // so the joined data isn't wiped out.
      queryClient.setQueryData(orderKeys.detail(orderId), (old: any) =>
        old ? { ...old, ...updated } : updated
      );
      // If a rider was just assigned, refetch once to pull in the rider's joined info.
      if (updated.rider_id && !query.data?.rider) {
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [orderId, queryClient, query.data?.rider]);

  return query;
}

export function useRestaurantOrders(restaurantId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: orderKeys.restaurant(restaurantId),
    queryFn: () => orderService.getRestaurantOrders(restaurantId),
    enabled: !!restaurantId,
    refetchInterval: 30 * 1000,
  });

  useEffect(() => {
    if (!restaurantId) return;
    const channel = orderService.subscribeToRestaurantOrders(restaurantId, () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.restaurant(restaurantId) });
    });
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, queryClient]);

  return query;
}

// Aggregates orders across ALL of an owner's restaurants, with live updates.
export function useOwnerOrders(restaurantIds: string[]) {
  const queryClient = useQueryClient();
  const idsKey = [...restaurantIds].sort().join(',');

  const query = useQuery({
    queryKey: ['orders', 'owner', idsKey],
    queryFn: () => orderService.getOrdersByRestaurants(restaurantIds),
    enabled: restaurantIds.length > 0,
    refetchInterval: 20 * 1000,
  });

  useEffect(() => {
    if (!restaurantIds.length) return;
    const channels = restaurantIds.map((id) =>
      orderService.subscribeToRestaurantOrders(id, () => {
        queryClient.invalidateQueries({ queryKey: ['orders', 'owner', idsKey] });
      })
    );
    return () => { channels.forEach((c) => supabase.removeChannel(c)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, queryClient]);

  return query;
}

export function useAvailableDeliveries() {
  return useQuery({
    queryKey: orderKeys.available(),
    queryFn: () => orderService.getAvailableDeliveries(),
    refetchInterval: 15 * 1000,
  });
}

export function useRiderActiveDelivery() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: orderKeys.riderActive(user?.id ?? ''),
    queryFn: () => orderService.getRiderActiveDelivery(user!.id),
    enabled: !!user && user.role === 'rider',
    refetchInterval: 30 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.customer(user?.id ?? '') });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, updates }: {
      orderId: string;
      status: OrderStatus;
      updates?: Record<string, unknown>;
    }) => orderService.updateOrderStatus(orderId, status, updates),
    onSuccess: (data) => {
      // Merge (don't replace) so joined customer/restaurant/items data is kept
      queryClient.setQueryData(orderKeys.detail(data.id), (old: any) =>
        old ? { ...old, ...data } : data
      );
      queryClient.invalidateQueries({ queryKey: orderKeys.restaurant(data.restaurant_id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.available() });
      queryClient.invalidateQueries({ queryKey: ['orders', 'owner'] });
      queryClient.invalidateQueries({ queryKey: ['rider'] });          // rider dashboard + earnings
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });  // profile header stats
    },
  });
}

export function useAcceptDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (orderId: string) => orderService.assignRider(orderId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.available() });
      queryClient.invalidateQueries({ queryKey: orderKeys.riderActive(user?.id ?? '') });
    },
  });
}
