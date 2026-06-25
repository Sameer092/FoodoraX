import { useQuery } from '@tanstack/react-query';
import { supabase } from '@services/supabase';
import { useAuthStore } from '@store/auth.store';

export interface ProfileStat {
  label: string;
  value: string;
}

/**
 * Returns 3 role-appropriate, REAL stats for the profile header.
 * - Customer: Orders, Favorites, Reviews
 * - Rider:    Deliveries, Earnings, Rating
 * - Owner:    Orders, Restaurants, Rating
 */
export function useProfileStats() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['profile-stats', user?.id, user?.role],
    enabled: !!user,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<ProfileStat[]> => {
      if (!user) return [];

      if (user.role === 'customer') {
        const [orders, favs, reviews] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', user.id),
          supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('customer_id', user.id),
        ]);
        return [
          { label: 'Orders', value: String(orders.count ?? 0) },
          { label: 'Favorites', value: String(favs.count ?? 0) },
          { label: 'Reviews', value: String(reviews.count ?? 0) },
        ];
      }

      if (user.role === 'rider') {
        const [{ data: rider }, { data: delivered }] = await Promise.all([
          supabase.from('riders').select('avg_rating').eq('id', user.id).maybeSingle(),
          supabase.from('orders').select('rider_payout').eq('rider_id', user.id).eq('status', 'delivered'),
        ]);
        const rows = (delivered ?? []) as { rider_payout: number }[];
        const earnings = rows.reduce((sum, o) => sum + Number(o.rider_payout ?? 0), 0);
        return [
          { label: 'Deliveries', value: String(rows.length) },
          { label: 'Earnings', value: `$${earnings.toFixed(0)}` },
          { label: 'Rating', value: Number(rider?.avg_rating ?? 0).toFixed(1) },
        ];
      }

      if (user.role === 'restaurant_owner') {
        const { data: rests } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', user.id);
        const ids = ((rests ?? []) as { id: string }[]).map((r) => r.id);

        let orderCount = 0;
        let earnings = 0;
        let rating = 0;

        if (ids.length) {
          // Orders count
          const { count } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .in('restaurant_id', ids);
          orderCount = count ?? 0;

          // Earnings = revenue from delivered orders
          const { data: delivered } = await supabase
            .from('orders')
            .select('total_amount')
            .in('restaurant_id', ids)
            .eq('status', 'delivered');
          earnings = ((delivered ?? []) as { total_amount: number }[])
            .reduce((s, o) => s + Number(o.total_amount ?? 0), 0);

          // Rating = average of REAL customer reviews (0 if none yet)
          const { data: reviews } = await supabase
            .from('reviews')
            .select('overall_rating')
            .in('restaurant_id', ids);
          const rows = (reviews ?? []) as { overall_rating: number }[];
          rating = rows.length
            ? rows.reduce((s, r) => s + Number(r.overall_rating ?? 0), 0) / rows.length
            : 0;
        }

        return [
          { label: 'Orders', value: String(orderCount) },
          { label: 'Earnings', value: `$${earnings.toFixed(0)}` },
          { label: 'Rating', value: rating.toFixed(1) },
        ];
      }

      return [];
    },
  });
}
