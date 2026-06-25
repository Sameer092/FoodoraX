import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@store/auth.store';
import { useAvailableDeliveries, useAcceptDelivery, useRiderActiveDelivery } from '@hooks/useOrders';
import { useRiderLocationTracking } from '@hooks/useLocation';
import { supabase } from '@services/supabase';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import type { Order } from '@types/index';

export function RiderDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);

  const { data: activeDelivery } = useRiderActiveDelivery();
  const { data: availableDeliveries, isLoading } = useAvailableDeliveries();
  const acceptDelivery = useAcceptDelivery();

  // Real rider stats
  const { data: stats } = useQuery({
    queryKey: ['rider', 'dashboard-stats', user?.id],
    enabled: !!user,
    refetchInterval: 30 * 1000,
    queryFn: async () => {
      const [{ data: rider }, { data: delivered }] = await Promise.all([
        supabase.from('riders').select('avg_rating').eq('id', user!.id).maybeSingle(),
        supabase.from('orders').select('rider_payout, delivered_at').eq('rider_id', user!.id).eq('status', 'delivered'),
      ]);
      const rows = (delivered ?? []) as { rider_payout: number; delivered_at: string }[];
      const today = new Date().toDateString();
      const todayRows = rows.filter((o) => o.delivered_at && new Date(o.delivered_at).toDateString() === today);
      return {
        todayCount: todayRows.length,
        todayEarnings: todayRows.reduce((s, o) => s + Number(o.rider_payout ?? 0), 0),
        rating: Number(rider?.avg_rating ?? 0),
      };
    },
  });

  useRiderLocationTracking(user?.id, isOnline);

  const toggleOnline = async (value: boolean) => {
    setIsOnline(value);
    await supabase
      .from('riders')
      .update({ status: value ? 'online' : 'offline' })
      .eq('id', user!.id);
  };

  const handleAccept = (orderId: string) => {
    Alert.alert('Accept Delivery', 'Accept this delivery order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          await acceptDelivery.mutateAsync(orderId);
          navigation.navigate('ActiveDelivery', { orderId });
        },
      },
    ]);
  };

  const renderDelivery = ({ item }: { item: Order }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <View style={styles.deliveryInfo}>
          <Text style={styles.orderNum}>#{item.order_number}</Text>
          <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurant?.name}</Text>
          <Text style={styles.restaurantAddr} numberOfLines={1}>{item.restaurant?.address}</Text>
        </View>
        <View style={styles.earningBadge}>
          <Text style={styles.earningText}>${item.delivery_fee?.toFixed(2)}</Text>
          <Text style={styles.earningLabel}>Earn</Text>
        </View>
      </View>

      <View style={styles.deliveryRoute}>
        <View style={styles.routeItem}>
          <View style={[styles.routeDot, { backgroundColor: Colors.primary[500] }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.restaurant?.address}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeItem}>
          <View style={[styles.routeDot, { backgroundColor: Colors.status.success }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.delivery_address?.address_line1}, {item.delivery_address?.city}
          </Text>
        </View>
      </View>

      <View style={styles.deliveryFooter}>
        <View style={styles.deliveryMeta}>
          <Ionicons name="cube-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.metaText}>{item.items?.length ?? 0} items</Text>
          <Ionicons name="cash-outline" size={14} color={Colors.light.textSecondary} style={{ marginLeft: 10 }} />
          <Text style={styles.metaText}>${item.total_amount?.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAccept(item.id)}
          disabled={acceptDelivery.isPending}
        >
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hey, {user?.full_name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Ready to deliver?</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('EarningsHistory')}>
            <Ionicons name="wallet-outline" size={20} color={Colors.dark[800]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('RiderProfile')}>
            <Ionicons name="person-outline" size={20} color={Colors.dark[800]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Online toggle pill */}
      <View style={styles.togglePill}>
        <View style={styles.toggleInfo}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? Colors.status.success : Colors.light.textTertiary }]} />
          <View>
            <Text style={styles.toggleTitle}>{isOnline ? "You're Online" : "You're Offline"}</Text>
            <Text style={styles.toggleSub}>{isOnline ? 'Receiving delivery requests' : 'Go online to receive requests'}</Text>
          </View>
        </View>
        <Switch
          value={isOnline}
          onValueChange={toggleOnline}
          trackColor={{ false: Colors.light.border, true: Colors.status.success }}
          thumbColor={Colors.white}
        />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Ionicons name="bicycle" size={24} color={Colors.primary[500]} />
          <Text style={styles.statValue}>{stats?.todayCount ?? 0}</Text>
          <Text style={styles.statLabel}>Today's Deliveries</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color={Colors.status.success} />
          <Text style={styles.statValue}>${(stats?.todayEarnings ?? 0).toFixed(2)}</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#FBBF24" />
          <Text style={styles.statValue}>{(stats?.rating ?? 0).toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Active Delivery Banner */}
      {activeDelivery && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() => navigation.navigate('ActiveDelivery', { orderId: activeDelivery.id })}
        >
          <View style={styles.activeIndicator} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeBannerTitle}>Active Delivery</Text>
            <Text style={styles.activeBannerSub}>#{activeDelivery.order_number} • {activeDelivery.restaurant?.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Available Deliveries */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Deliveries</Text>
        <Text style={styles.count}>{availableDeliveries?.length ?? 0} nearby</Text>
      </View>

      {!isOnline ? (
        <EmptyState
          icon="bicycle-outline"
          title="You're offline"
          description="Go online to start receiving delivery requests"
        />
      ) : (
        <FlatList
          data={availableDeliveries}
          keyExtractor={(item) => item.id}
          renderItem={renderDelivery}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="bicycle-outline"
              title="No deliveries yet"
              description="New delivery requests will appear here"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.white,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.dark[900] },
  subGreeting: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.light.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  togglePill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 4, marginBottom: 8,
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark[900] },
  toggleSub: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
  stats: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  statLabel: { fontSize: 10, color: Colors.light.textSecondary, textAlign: 'center' },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primary[500], marginHorizontal: 16, borderRadius: 14,
    padding: 14, marginBottom: 8,
  },
  activeIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.white },
  activeBannerTitle: { fontSize: 14, fontWeight: '800', color: Colors.white },
  activeBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  count: { fontSize: 13, color: Colors.light.textSecondary },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  deliveryCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  deliveryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  deliveryInfo: { flex: 1, marginRight: 12 },
  orderNum: { fontSize: 11, color: Colors.light.textSecondary, fontWeight: '600', marginBottom: 2 },
  restaurantName: { fontSize: 16, fontWeight: '700', color: Colors.dark[900] },
  restaurantAddr: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  earningBadge: {
    backgroundColor: Colors.primary[50], borderRadius: 12, padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primary[200],
  },
  earningText: { fontSize: 16, fontWeight: '900', color: Colors.primary[600] },
  earningLabel: { fontSize: 10, color: Colors.primary[500] },
  deliveryRoute: { marginBottom: 14, gap: 4 },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 2, height: 12, backgroundColor: Colors.light.border, marginLeft: 3 },
  routeText: { fontSize: 12, color: Colors.dark[700], flex: 1 },
  deliveryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deliveryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.light.textSecondary },
  acceptBtn: {
    backgroundColor: Colors.primary[500], borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});
