import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurantOrders } from '@hooks/useOrders';
import { useRestaurant } from '@hooks/useRestaurants';
import { Colors } from '@constants/colors';

export function AnalyticsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId } = route.params;

  const { data: orders } = useRestaurantOrders(restaurantId);
  const { data: restaurant } = useRestaurant(restaurantId);

  const stats = useMemo(() => {
    const all = orders ?? [];
    const delivered = all.filter((o) => o.status === 'delivered');
    const cancelled = all.filter((o) => o.status === 'cancelled');
    const revenue = delivered.reduce((sum, o) => sum + o.total_amount, 0);
    const avgOrder = delivered.length ? revenue / delivered.length : 0;
    const today = new Date().toDateString();
    const todayRevenue = delivered
      .filter((o) => new Date(o.created_at).toDateString() === today)
      .reduce((sum, o) => sum + o.total_amount, 0);

    return {
      totalOrders: all.length,
      delivered: delivered.length,
      cancelled: cancelled.length,
      revenue,
      avgOrder,
      todayRevenue,
    };
  }, [orders]);

  const cards = [
    { label: 'Total Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: 'cash', color: Colors.status.success, bg: '#dcfce7' },
    { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, icon: 'today', color: Colors.primary[600], bg: Colors.primary[50] },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: 'receipt', color: Colors.status.info, bg: '#dbeafe' },
    { label: 'Delivered', value: String(stats.delivered), icon: 'checkmark-done', color: Colors.status.success, bg: '#dcfce7' },
    { label: 'Cancelled', value: String(stats.cancelled), icon: 'close-circle', color: Colors.status.error, bg: '#fee2e2' },
    { label: 'Avg Order Value', value: `$${stats.avgOrder.toFixed(2)}`, icon: 'trending-up', color: '#7c3aed', bg: '#ede9fe' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.ratingCard}>
          <Ionicons name="star" size={28} color="#FBBF24" />
          <Text style={styles.ratingValue}>{restaurant?.avg_rating?.toFixed(1) ?? '0.0'}</Text>
          <Text style={styles.ratingLabel}>{restaurant?.total_reviews ?? 0} reviews</Text>
        </View>

        <View style={styles.grid}>
          {cards.map((card) => (
            <View key={card.label} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: card.bg }]}>
                <Ionicons name={card.icon as any} size={20} color={card.color} />
              </View>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  scroll: { padding: 16 },
  ratingCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  ratingValue: { fontSize: 32, fontWeight: '900', color: Colors.dark[900], marginTop: 4 },
  ratingLabel: { fontSize: 13, color: Colors.light.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%', backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardValue: { fontSize: 22, fontWeight: '900', color: Colors.dark[900] },
  cardLabel: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
});
