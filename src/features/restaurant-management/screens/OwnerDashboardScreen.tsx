import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/auth.store';
import { restaurantService } from '@services/restaurant.service';
import { useQuery } from '@tanstack/react-query';
import { useOwnerOrders } from '@hooks/useOrders';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { Colors } from '@constants/colors';
import type { Restaurant } from '@types/index';

export function OwnerDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['restaurants', 'owner', user?.id],
    queryFn: () => restaurantService.getRestaurantsByOwner(user!.id),
    enabled: !!user,
  });

  const firstRestaurant = restaurants?.[0];
  const restaurantIds = (restaurants ?? []).map((r) => r.id);
  const { data: orders } = useOwnerOrders(restaurantIds);

  const pendingOrders = orders?.filter((o) => o.status === 'pending') ?? [];
  const activeOrders = orders?.filter((o) => ['accepted', 'preparing', 'ready'].includes(o.status)) ?? [];
  const todayRevenue = orders
    ?.filter((o) => o.status === 'delivered' && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total_amount, 0) ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.restaurantName}>{firstRestaurant?.name ?? 'Your Restaurant'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => firstRestaurant && navigation.navigate('RestaurantSettings', { restaurantId: firstRestaurant.id })}
            >
              <Ionicons name="settings-outline" size={22} color={Colors.dark[800]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-outline" size={22} color={Colors.dark[800]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* No Restaurant */}
        {!firstRestaurant && !isLoading && (
          <TouchableOpacity
            style={styles.createRestaurantCard}
            onPress={() => navigation.navigate('CreateRestaurant')}
          >
            <Ionicons name="add-circle" size={48} color={Colors.primary[500]} />
            <Text style={styles.createTitle}>Create Your Restaurant</Text>
            <Text style={styles.createSubtitle}>Get started by setting up your restaurant profile</Text>
          </TouchableOpacity>
        )}

        {/* Pending approval banner */}
        {firstRestaurant && !firstRestaurant.is_verified && (
          <View style={styles.pendingBanner}>
            <Ionicons name="hourglass-outline" size={20} color="#92400e" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Pending Admin Approval</Text>
              <Text style={styles.pendingText}>
                Your restaurant isn't visible to customers yet. You can set up your menu while you wait.
              </Text>
            </View>
          </View>
        )}

        {/* Stats */}
        {firstRestaurant && (
          <>
            <View style={styles.stats}>
              <View style={styles.statCard}>
                <Ionicons name="time" size={22} color={Colors.status.warning} />
                <Text style={styles.statValue}>{pendingOrders.length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flame" size={22} color={Colors.primary[500]} />
                <Text style={styles.statValue}>{activeOrders.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cash" size={22} color={Colors.status.success} />
                <Text style={styles.statValue}>${todayRevenue.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Today Revenue</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('OrderManagement', { restaurantId: firstRestaurant.id, restaurantIds })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                    <Ionicons name="receipt" size={22} color="#1d4ed8" />
                  </View>
                  <Text style={styles.actionLabel}>Orders</Text>
                  {pendingOrders.length > 0 && (
                    <View style={styles.badge}><Text style={styles.badgeText}>{pendingOrders.length}</Text></View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('MenuManagement', { restaurantId: firstRestaurant.id })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="restaurant" size={22} color="#15803d" />
                  </View>
                  <Text style={styles.actionLabel}>Menu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Analytics', { restaurantId: firstRestaurant.id })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="bar-chart" size={22} color="#b45309" />
                  </View>
                  <Text style={styles.actionLabel}>Analytics</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('RestaurantSettings', { restaurantId: firstRestaurant.id })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}>
                    <Ionicons name="settings" size={22} color="#9d174d" />
                  </View>
                  <Text style={styles.actionLabel}>Settings</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pending Orders</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('OrderManagement', { restaurantId: firstRestaurant.id, restaurantIds })}>
                    <Text style={styles.seeAll}>See all</Text>
                  </TouchableOpacity>
                </View>
                {pendingOrders.slice(0, 3).map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                  >
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderNum}>#{order.order_number}</Text>
                      <Text style={styles.customerName}>{order.customer?.full_name}</Text>
                      <Text style={styles.itemCount}>
                        {order.restaurant?.name ? `${order.restaurant.name} · ` : ''}{order.items?.length ?? 0} items
                      </Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={styles.orderTotal}>${order.total_amount.toFixed(2)}</Text>
                      <OrderStatusBadge status={order.status} size="sm" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  greeting: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '500' },
  restaurantName: { fontSize: 22, fontWeight: '800', color: Colors.dark[900] },
  headerActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.light.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fef3c7', marginHorizontal: 16, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#fde68a',
  },
  pendingTitle: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  pendingText: { fontSize: 12, color: '#92400e', marginTop: 2, lineHeight: 16 },
  createRestaurantCard: {
    margin: 20, backgroundColor: Colors.white, borderRadius: 20, padding: 40,
    alignItems: 'center', gap: 10,
    borderWidth: 2, borderColor: Colors.primary[200], borderStyle: 'dashed',
  },
  createTitle: { fontSize: 20, fontWeight: '800', color: Colors.dark[900] },
  createSubtitle: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: Colors.dark[900] },
  statLabel: { fontSize: 10, color: Colors.light.textSecondary },
  section: { marginHorizontal: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900], marginBottom: 12 },
  seeAll: { fontSize: 13, color: Colors.primary[600], fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '47%', backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 8, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark[800] },
  badge: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.status.error, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  orderCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  orderInfo: { gap: 2 },
  orderNum: { fontSize: 13, fontWeight: '700', color: Colors.dark[900] },
  customerName: { fontSize: 12, color: Colors.dark[600] },
  itemCount: { fontSize: 11, color: Colors.light.textSecondary },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  orderTotal: { fontSize: 16, fontWeight: '800', color: Colors.dark[900] },
});
