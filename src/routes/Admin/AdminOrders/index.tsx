import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import { format } from 'date-fns';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { Header, EmptyState } from '@components/common';
import StatusBadge from '@components/common/StatusBadge';
import * as AdminActions from '@store/Admin/actions';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

let enhancer = connect(null, { ...AdminActions });

function AdminOrders({ navigation, getAllOrders, getStats, cancelOrder }) {
  const [orders, setOrders] = useState([]);
  const [commission, setCommission] = useState(15);
  const [tab, setTab] = useState('all');

  const load = useCallback(async () => {
    const [list, stats] = await Promise.all([getAllOrders(), getStats()]);
    setOrders(list);
    setCommission(stats.commissionPct || 15);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const match = (s) => {
    if (tab === 'all') return true;
    if (tab === 'active') return ['pending', 'accepted', 'preparing', 'ready', 'picked_up'].includes(s);
    return s === tab;
  };
  const filtered = orders.filter((o) => match(o.status));

  const delivered = orders.filter((o) => o.status === 'delivered');
  const gmv = delivered.reduce((s, o) => s + Number(o.total_amount), 0);
  const revenue = delivered.reduce((s, o) => s + Number(o.subtotal || 0) * (commission / 100), 0);

  const cancel = (o) => {
    const wasPaid = o.payment_status === 'paid';
    Alert.alert('Cancel Order', `Cancel order #${o.order_number}?${wasPaid ? ' Customer will be refunded.' : ''}`, [
      { text: 'Back', style: 'cancel' },
      { text: 'Cancel Order', style: 'destructive', onPress: async () => { await cancelOrder(o.id, 'Cancelled by admin', wasPaid); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Orders" onBack={() => navigation.goBack()} />
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.summary}>
              <View style={styles.sumCard}>
                <Text style={styles.sumValue}>{currency(gmv)}</Text>
                <Text style={styles.sumLabel}>GMV</Text>
              </View>
              <View style={[styles.sumCard, { backgroundColor: colors.primary }]}>
                <Text style={[styles.sumValue, { color: colors.white }]}>{currency(revenue)}</Text>
                <Text style={[styles.sumLabel, { color: colors.white, opacity: 0.85 }]}>Revenue ({commission}%)</Text>
              </View>
            </View>
            <View style={styles.tabs}>
              {TABS.map((t) => (
                <TouchableOpacity key={t.value} onPress={() => setTab(t.value)} style={[styles.tab, tab === t.value && styles.tabActive]}>
                  <Text style={[styles.tabText, tab === t.value && styles.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders" description="Nothing here yet" />}
        renderItem={({ item }) => {
          const rev = item.status === 'delivered' ? Number(item.subtotal || 0) * (commission / 100) : 0;
          const canCancel = ['pending', 'accepted', 'preparing', 'ready'].includes(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNum}>#{item.order_number}</Text>
                  <Text style={styles.meta}>{item.restaurant && item.restaurant.name}</Text>
                  <Text style={styles.meta}>{item.customer && item.customer.full_name}{item.rider ? ` · 🏍 ${item.rider.full_name}` : ''}</Text>
                  <Text style={styles.date}>{format(new Date(item.created_at), 'MMM d, h:mm a')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.total}>{currency(item.total_amount)}</Text>
                  <StatusBadge status={item.status} />
                </View>
              </View>
              {rev > 0 ? <Text style={styles.revenue}>Platform revenue: {currency(rev)}</Text> : null}
              {canCancel ? (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => cancel(item)}>
                  <Text style={styles.cancelText}>Cancel Order</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

export default enhancer(AdminOrders);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  list: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    gap: hp(1.5)
  },
  summary: {
    flexDirection: 'row',
    gap: wp(3),
    paddingTop: hp(1.5),
    marginBottom: hp(1)
  },
  sumCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(4),
    alignItems: 'center'
  },
  sumValue: {
    fontWeight: Bold,
    fontSize: wp(5.5),
    color: colors.txtDark
  },
  sumLabel: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary,
    marginTop: 2
  },
  tabs: {
    flexDirection: 'row',
    gap: wp(2),
    marginBottom: hp(0.5)
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
    fontSize: wp(3),
    color: colors.dark600
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: Bold
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(4)
  },
  cardTop: {
    flexDirection: 'row'
  },
  orderNum: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  meta: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.dark600,
    marginTop: 2
  },
  date: {
    fontWeight: Regular,
    fontSize: wp(2.8),
    color: colors.txtTertiary,
    marginTop: 2
  },
  total: {
    fontWeight: Bold,
    fontSize: wp(4.2),
    color: colors.txtDark,
    marginBottom: hp(0.5)
  },
  revenue: {
    fontWeight: Medium,
    fontSize: wp(3.2),
    color: colors.successDark,
    backgroundColor: colors.successSoft,
    borderRadius: wp(2),
    padding: wp(2.5),
    marginTop: hp(1.2)
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: wp(2.5),
    paddingVertical: hp(1.2),
    alignItems: 'center',
    marginTop: hp(1.2)
  },
  cancelText: {
    fontWeight: Bold,
    fontSize: wp(3.4),
    color: colors.danger
  }
});
