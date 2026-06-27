import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@services/admin.service';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { format } from 'date-fns';
import type { Order } from '@types/index';

const TABS = ['All', 'Active', 'Delivered', 'Cancelled'];

export function AdminOrdersScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('All');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => adminService.getAllOrders(),
    refetchInterval: 30 * 1000,
  });

  const cancelOrder = useMutation({
    mutationFn: ({ id, wasPaid }: { id: string; wasPaid: boolean }) =>
      adminService.cancelOrder(id, 'Cancelled by admin', wasPaid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'Could not cancel order'),
  });

  const confirmCancel = (order: Order) => {
    Alert.alert(
      'Cancel Order',
      `Cancel order #${order.order_number}? This can't be undone.`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => cancelOrder.mutate({ id: order.id, wasPaid: order.payment_status === 'succeeded' }),
        },
      ],
    );
  };

  const { data: settings } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.getSettings(),
  });
  const commissionPct = Number(settings?.platform_commission ?? 15);

  const all = orders ?? [];

  // Platform commission earned on a single order (delivered only)
  const commissionFor = (o: Order) =>
    o.status === 'delivered' ? Number(o.subtotal ?? 0) * (commissionPct / 100) : 0;

  const summary = useMemo(() => {
    const delivered = all.filter((o) => o.status === 'delivered');
    const gmv = delivered.reduce((s, o) => s + Number(o.total_amount), 0);
    const revenue = delivered.reduce((s, o) => s + Number(o.subtotal ?? 0) * (commissionPct / 100), 0);
    const active = all.filter((o) => !['delivered', 'cancelled', 'refunded'].includes(o.status)).length;
    return { gmv, revenue, deliveredCount: delivered.length, active, total: all.length };
  }, [all, commissionPct]);

  const filtered = all.filter((o) => {
    if (tab === 'All') return true;
    if (tab === 'Active') return !['delivered', 'cancelled', 'refunded'].includes(o.status);
    if (tab === 'Delivered') return o.status === 'delivered';
    if (tab === 'Cancelled') return ['cancelled', 'refunded'].includes(o.status);
    return true;
  });

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNum}>#{item.order_number}</Text>
          <Text style={styles.restaurant}>{item.restaurant?.name ?? 'Restaurant'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={styles.total}>${Number(item.total_amount).toFixed(2)}</Text>
          <OrderStatusBadge status={item.status} size="sm" />
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>👤 {item.customer?.full_name ?? '—'}</Text>
        <Text style={styles.meta}>🏍️ {item.rider?.full_name ?? 'Unassigned'}</Text>
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.date}>{format(new Date(item.created_at), 'MMM d, yyyy · h:mm a')}</Text>
        {item.status === 'delivered' && (
          <Text style={styles.commission}>+${commissionFor(item).toFixed(2)} revenue</Text>
        )}
      </View>

      {/* Admin can cancel any order that isn't finished */}
      {!['delivered', 'cancelled', 'refunded'].includes(item.status) && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(item)}>
          <Ionicons name="close-circle-outline" size={16} color={Colors.status.error} />
          <Text style={styles.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>All Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* GMV / revenue breakdown */}
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>${summary.gmv.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>GMV</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.primary[50] }]}>
          <Text style={[styles.summaryValue, { color: Colors.primary[600] }]}>${summary.revenue.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Revenue ({commissionPct}%)</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Orders</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders" description="No orders in this category yet" />}
        />
      )}
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
  title: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  summary: { flexDirection: 'row', gap: 10, padding: 16 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  summaryValue: { fontSize: 18, fontWeight: '900', color: Colors.dark[900] },
  summaryLabel: { fontSize: 10, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 6, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.light.border },
  tabActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  tabText: { fontSize: 12, fontWeight: '500', color: Colors.dark[600] },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  orderNum: { fontSize: 14, fontWeight: '700', color: Colors.dark[900] },
  restaurant: { fontSize: 13, color: Colors.primary[600], fontWeight: '600', marginTop: 1 },
  total: { fontSize: 16, fontWeight: '800', color: Colors.dark[900] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  meta: { fontSize: 12, color: Colors.dark[600] },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11, color: Colors.light.textTertiary },
  commission: { fontSize: 12, fontWeight: '800', color: Colors.status.success },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.status.error,
  },
  cancelText: { fontSize: 13, fontWeight: '700', color: Colors.status.error },
});
