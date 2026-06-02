import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@services/supabase';
import { useAuthStore } from '@store/auth.store';
import { EmptyState } from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { format } from 'date-fns';
import type { Order } from '@types/index';

export function EarningsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const { data: orders } = useQuery({
    queryKey: ['rider', 'earnings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, delivery_fee, total_amount, delivered_at, status')
        .eq('rider_id', user!.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const all = orders ?? [];
    const totalEarnings = all.reduce((sum, o) => sum + (o.delivery_fee ?? 0), 0);
    const today = new Date().toDateString();
    const todayEarnings = all
      .filter((o) => o.delivered_at && new Date(o.delivered_at).toDateString() === today)
      .reduce((sum, o) => sum + (o.delivery_fee ?? 0), 0);
    return { totalEarnings, todayEarnings, count: all.length };
  }, [orders]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>${stats.totalEarnings.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>${stats.todayEarnings.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Today</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.count}</Text>
          <Text style={styles.summaryLabel}>Deliveries</Text>
        </View>
      </View>

      <FlatList
        data={orders ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.listTitle}>Delivery History</Text>}
        ListEmptyComponent={
          <EmptyState icon="cash-outline" title="No earnings yet" description="Completed deliveries will show here" />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="bicycle" size={18} color={Colors.primary[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderNum}>#{item.order_number}</Text>
              <Text style={styles.date}>
                {item.delivered_at ? format(new Date(item.delivered_at), 'MMM d, h:mm a') : ''}
              </Text>
            </View>
            <Text style={styles.earning}>+${item.delivery_fee?.toFixed(2)}</Text>
          </View>
        )}
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
  title: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  summary: { flexDirection: 'row', gap: 10, padding: 16 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  summaryValue: { fontSize: 18, fontWeight: '900', color: Colors.dark[900] },
  summaryLabel: { fontSize: 10, color: Colors.light.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  listTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark[900], marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 8,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  orderNum: { fontSize: 14, fontWeight: '700', color: Colors.dark[900] },
  date: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  earning: { fontSize: 16, fontWeight: '800', color: Colors.status.success },
});
