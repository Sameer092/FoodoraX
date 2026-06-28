import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { format } from 'date-fns';
import { Header, EmptyState } from '@components/common';
import StatusBadge from '@components/common/StatusBadge';
import * as OrderActions from '@store/Orders/actions';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Done', value: 'done' },
];
const NEXT = {
  pending: { label: 'Accept', next: 'accepted', color: colors.info },
  accepted: { label: 'Preparing', next: 'preparing', color: '#7c3aed' },
  preparing: { label: 'Ready', next: 'ready', color: colors.success },
};

let enhancer = connect(null, { ...OrderActions });

function delivery(order) {
  const r = order.rider && order.rider.full_name;
  if (order.status === 'delivered') return `Delivered${r ? ` by ${r}` : ''}`;
  if (order.status === 'picked_up') return `Out for delivery${r ? ` · ${r}` : ''}`;
  if (order.rider_id) return `${r || 'A rider'} is picking up`;
  return 'Waiting for a rider...';
}

function OrderManagement({ navigation, route, getOrdersByRestaurants, updateOrderStatus }) {
  const ids = route.params && route.params.restaurantIds ? route.params.restaurantIds : [route.params.restaurantId];
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('all');

  const load = useCallback(() => { getOrdersByRestaurants(ids).then(setOrders); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const match = (s) => {
    if (tab === 'all') return true;
    if (tab === 'active') return ['accepted', 'preparing', 'ready', 'picked_up'].includes(s);
    if (tab === 'done') return ['delivered', 'cancelled', 'refunded'].includes(s);
    return s === tab;
  };
  const filtered = orders.filter((o) => match(o.status));

  const act = (order, next) => {
    Alert.alert('Update Order', `Mark as "${next}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => { await updateOrderStatus(order.id, next); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Orders" onBack={() => navigation.goBack()} />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.value} onPress={() => setTab(t.value)} style={[styles.tab, tab === t.value && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.value && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders" description="Orders will appear here" />}
        renderItem={({ item }) => {
          const next = NEXT[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNum}>#{item.order_number}</Text>
                  {ids.length > 1 && item.restaurant ? <Text style={styles.tag}>🍽 {item.restaurant.name}</Text> : null}
                  <Text style={styles.customer}>{item.customer && item.customer.full_name}</Text>
                  <Text style={styles.time}>{format(new Date(item.created_at), 'h:mm a')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.total}>{currency(item.total_amount)}</Text>
                  <StatusBadge status={item.status} />
                </View>
              </View>
              <View style={styles.items}>
                {(item.items || []).map((i) => <Text key={i.id} style={styles.itemText}>• {i.quantity}x {i.name}</Text>)}
              </View>
              {['ready', 'picked_up', 'delivered'].includes(item.status) ? (
                <Text style={styles.delivery}>{delivery(item)}</Text>
              ) : null}
              {next ? (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: next.color }]} onPress={() => act(item, next.next)}>
                  <Text style={styles.actionText}>{next.label}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

export default enhancer(OrderManagement);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  tabs: {
    flexDirection: 'row',
    padding: wp(4),
    gap: wp(2)
  },
  tab: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.8),
    borderRadius: wp(5),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tabText: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.dark600
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: Bold
  },
  list: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    gap: hp(1.5)
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(4)
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: hp(1)
  },
  orderNum: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  tag: {
    fontWeight: Medium,
    fontSize: wp(3),
    color: colors.primaryDark,
    marginTop: 2
  },
  customer: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.dark600,
    marginTop: 2
  },
  time: {
    fontWeight: Regular,
    fontSize: wp(2.8),
    color: colors.txtTertiary,
    marginTop: 2
  },
  total: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark,
    marginBottom: hp(0.5)
  },
  items: {
    marginBottom: hp(1.2)
  },
  itemText: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.dark600,
    marginBottom: 2
  },
  delivery: {
    fontWeight: Medium,
    fontSize: wp(3.2),
    color: colors.dark700,
    backgroundColor: colors.surface,
    borderRadius: wp(2.5),
    padding: wp(2.5),
    marginBottom: hp(1)
  },
  actionBtn: {
    paddingVertical: hp(1.3),
    borderRadius: wp(2.5),
    alignItems: 'center'
  },
  actionText: {
    fontWeight: Bold,
    fontSize: wp(3.4),
    color: colors.white
  }
});
