import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurantOrders, useOwnerOrders, useUpdateOrderStatus } from '@hooks/useOrders';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { format } from 'date-fns';
import type { Order, OrderStatus } from '@types/index';

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Done', value: 'delivered' },
];

const NEXT_ACTIONS: Record<string, { label: string; next: OrderStatus; color: string }> = {
  pending:   { label: 'Accept',    next: 'accepted',  color: Colors.status.info },
  accepted:  { label: 'Preparing', next: 'preparing', color: '#7c3aed' },
  preparing: { label: 'Ready',     next: 'ready',     color: Colors.status.success },
};

export function OrderManagementScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId, restaurantIds } = route.params as { restaurantId: string; restaurantIds?: string[] };

  // If the owner has multiple restaurants, show orders across all of them.
  const ids = restaurantIds && restaurantIds.length > 0 ? restaurantIds : [restaurantId];
  const multi = ids.length > 1;

  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const single = useRestaurantOrders(multi ? '' : ids[0]);
  const owner = useOwnerOrders(multi ? ids : []);
  const allOrders = multi ? owner.data : single.data;
  const isLoading = multi ? owner.isLoading : single.isLoading;
  const updateStatus = useUpdateOrderStatus();

  const matchesTab = (status: OrderStatus, tab: OrderStatus | 'all') => {
    if (tab === 'all') return true;
    if (tab === 'preparing') return ['accepted', 'preparing', 'ready', 'picked_up'].includes(status); // Active = in progress
    if (tab === 'delivered') return ['delivered', 'cancelled', 'refunded'].includes(status); // Done
    return status === tab;
  };

  const filtered = allOrders?.filter((o) => matchesTab(o.status, activeTab)) ?? [];

  const handleAction = (order: Order, next: OrderStatus) => {
    Alert.alert('Update Order', `Mark order #${order.order_number} as "${next}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus.mutate({ orderId: order.id, status: next }) },
    ]);
  };

  const handleCancel = (order: Order) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Order',
        style: 'destructive',
        onPress: () => updateStatus.mutate({
          orderId: order.id,
          status: 'cancelled',
          updates: { cancellation_reason: 'Cancelled by restaurant' },
        }),
      },
    ]);
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const nextAction = NEXT_ACTIONS[item.status];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNum}>#{item.order_number}</Text>
            {multi && item.restaurant?.name && (
              <Text style={styles.restaurantTag}>🍽 {item.restaurant.name}</Text>
            )}
            <Text style={styles.customerName}>{item.customer?.full_name}</Text>
            <Text style={styles.orderTime}>{format(new Date(item.created_at), 'h:mm a')}</Text>
          </View>
          <View style={styles.rightHeader}>
            <Text style={styles.total}>${item.total_amount.toFixed(2)}</Text>
            <OrderStatusBadge status={item.status} size="sm" />
          </View>
        </View>

        {/* Items */}
        <View style={styles.items}>
          {item.items?.map((i) => (
            <Text key={i.id} style={styles.itemText}>• {i.quantity}x {i.name}</Text>
          ))}
        </View>

        {/* Actions */}
        {nextAction && (
          <View style={styles.actions}>
            {item.status === 'pending' && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancel(item)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: nextAction.color, flex: 1 }]}
              onPress={() => handleAction(item, nextAction.next)}
            >
              <Text style={styles.actionBtnText}>{nextAction.label}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => {
          const count = tab.value === 'all'
            ? allOrders?.length
            : allOrders?.filter((o) => matchesTab(o.status, tab.value)).length;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
                {tab.label} {count ? `(${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" title="No orders" description="Orders will appear here" />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.light.border,
  },
  tabActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  tabText: { fontSize: 12, fontWeight: '500', color: Colors.dark[600] },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderNum: { fontSize: 15, fontWeight: '700', color: Colors.dark[900] },
  customerName: { fontSize: 13, color: Colors.dark[600], marginTop: 2 },
  restaurantTag: { fontSize: 12, color: Colors.primary[600], fontWeight: '600', marginTop: 2 },
  orderTime: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 2 },
  rightHeader: { alignItems: 'flex-end', gap: 6 },
  total: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  items: { marginBottom: 14 },
  itemText: { fontSize: 13, color: Colors.dark[600], marginBottom: 3 },
  actions: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.status.error,
  },
  cancelBtnText: { fontSize: 13, color: Colors.status.error, fontWeight: '700' },
  actionBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 13, color: Colors.white, fontWeight: '700' },
});
