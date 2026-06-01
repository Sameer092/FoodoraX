import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCustomerOrders } from '@hooks/useOrders';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { OrderCardSkeleton } from '@components/common/SkeletonLoader';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { format } from 'date-fns';
import type { Order } from '@types/index';
import type { CustomerStackNavigationProp } from '@types/navigation.types';

const TABS = ['All', 'Active', 'Completed', 'Cancelled'];

export function OrdersScreen() {
  const navigation = useNavigation<CustomerStackNavigationProp>();
  const [activeTab, setActiveTab] = useState('All');
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCustomerOrders();

  const allOrders = data?.pages.flatMap((p) => p.data) ?? [];

  const filtered = allOrders.filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return !['delivered', 'cancelled', 'refunded'].includes(o.status);
    if (activeTab === 'Completed') return o.status === 'delivered';
    if (activeTab === 'Cancelled') return ['cancelled', 'refunded'].includes(o.status);
    return true;
  });

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        ['delivered', 'cancelled', 'refunded'].includes(item.status)
          ? navigation.navigate('OrderDetail', { orderId: item.id })
          : navigation.navigate('OrderTracking', { orderId: item.id })
      }
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        {item.restaurant?.logo_url ? (
          <Image source={{ uri: item.restaurant.logo_url }} style={styles.logo} contentFit="cover" />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="restaurant" size={20} color={Colors.primary[500]} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurant?.name}</Text>
          <Text style={styles.orderDate}>{format(new Date(item.created_at), 'MMM d, yyyy  h:mm a')}</Text>
        </View>
        <OrderStatusBadge status={item.status} size="sm" />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <Text style={styles.itemsSummary} numberOfLines={1}>
          {item.items?.map((i) => `${i.quantity}x ${i.name}`).join(' · ')}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.orderNum}>#{item.order_number}</Text>
          <Text style={styles.total}>${item.total_amount.toFixed(2)}</Text>
        </View>
      </View>

      {!['delivered', 'cancelled', 'refunded'].includes(item.status) && (
        <View style={styles.trackBtn}>
          <Ionicons name="navigate" size={14} color={Colors.primary[500]} />
          <Text style={styles.trackText}>Track Order</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={{ padding: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              description="Place your first order and it'll appear here"
              actionLabel="Browse Restaurants"
              onAction={() => navigation.navigate('CustomerTabs')}
            />
          }
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={Colors.primary[500]} style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.dark[900] },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 6 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  tabActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.dark[600] },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  logo: { width: 46, height: 46, borderRadius: 12 },
  logoPlaceholder: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  restaurantName: { fontSize: 15, fontWeight: '700', color: Colors.dark[900] },
  orderDate: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.light.border },
  cardBody: { padding: 14 },
  itemsSummary: { fontSize: 13, color: Colors.dark[600], marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 12, color: Colors.light.textSecondary },
  total: { fontSize: 16, fontWeight: '800', color: Colors.dark[900] },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary[50], paddingVertical: 10,
  },
  trackText: { fontSize: 13, fontWeight: '700', color: Colors.primary[600] },
});
