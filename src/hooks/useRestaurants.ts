import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@services/restaurant.service';
import { favoritesService } from '@services/favorites.service';
import type { SearchFilters, MenuItem } from '@types/index';
import { useAuthStore } from '@store/auth.store';

export const restaurantKeys = {
  all: ['restaurants'] as const,
  lists: () => [...restaurantKeys.all, 'list'] as const,
  list: (filters: SearchFilters) => [...restaurantKeys.lists(), filters] as const,
  featured: () => [...restaurantKeys.all, 'featured'] as const,
  nearby: (lat: number, lon: number) => [...restaurantKeys.all, 'nearby', lat, lon] as const,
  detail: (id: string) => [...restaurantKeys.all, 'detail', id] as const,
  reviews: (id: string) => [...restaurantKeys.all, 'reviews', id] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
};

export function useRestaurants(filters: SearchFilters = {}) {
  return useInfiniteQuery({
    queryKey: restaurantKeys.list(filters),
    queryFn: ({ pageParam = 0 }) =>
      restaurantService.getRestaurants({ ...filters, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 2 * 60 * 1000,
  });
}

export function useFeaturedRestaurants() {
  return useQuery({
    queryKey: restaurantKeys.featured(),
    queryFn: () => restaurantService.getFeaturedRestaurants(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNearbyRestaurants(lat: number, lon: number) {
  return useQuery({
    queryKey: restaurantKeys.nearby(lat, lon),
    queryFn: () => restaurantService.getNearbyRestaurants(lat, lon),
    enabled: !!lat && !!lon,
    staleTime: 3 * 60 * 1000,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: restaurantKeys.detail(id),
    queryFn: () => restaurantService.getRestaurantById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRestaurantReviews(restaurantId: string) {
  return useInfiniteQuery({
    queryKey: restaurantKeys.reviews(restaurantId),
    queryFn: ({ pageParam = 0 }) =>
      restaurantService.getReviews(restaurantId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last, allPages) => (last.hasMore ? allPages.length : undefined),
    enabled: !!restaurantId,
  });
}

export function useFavorites() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: restaurantKeys.favorites(user?.id ?? ''),
    queryFn: () => favoritesService.getFavorites(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (restaurantId: string) =>
      favoritesService.toggleFavoriteRestaurant(user!.id, restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.favorites(user?.id ?? '') });
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Omit<MenuItem, 'id' | 'avg_rating' | 'created_at' | 'updated_at'>) =>
      restaurantService.createMenuItem(item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.detail(variables.restaurant_id) });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<MenuItem> & { id: string }) =>
      restaurantService.updateMenuItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restaurantService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: restaurantKeys.all });
    },
  });
}
