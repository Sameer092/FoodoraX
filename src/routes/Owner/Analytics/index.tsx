import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { Header } from '@components/common';
import * as OrderActions from '@store/Orders/actions';

let enhancer = connect(null, { ...OrderActions });

function within(dateStr, days) {
  const d = new Date(dateStr).getTime();
  return Date.now() - d <= days * 86400000;
}

function Analytics({ navigation, route, getOrdersByRestaurants }) {
  const ids = route.params && route.params.restaurantIds ? route.params.restaurantIds : [route.params.restaurantId];
  const [orders, setOrders] = useState([]);

  const load = useCallback(() => { getOrdersByRestaurants(ids).then(setOrders); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const delivered = orders.filter((o) => o.status === 'delivered');
  const revenue = delivered.reduce((s, o) => s + o.total_amount, 0);
  const aov = delivered.length ? revenue / delivered.length : 0;
  const cancelled = orders.filter((o) => ['cancelled', 'refunded'].includes(o.status)).length;
  const week = delivered.filter((o) => within(o.created_at, 7)).reduce((s, o) => s + o.total_amount, 0);
  const month = delivered.filter((o) => within(o.created_at, 30)).reduce((s, o) => s + o.total_amount, 0);

  const counts = {};
  delivered.forEach((o) => (o.items || []).forEach((i) => { counts[i.name] = (counts[i.name] || 0) + i.quantity; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Analytics" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Revenue</Text>
          <Text style={styles.heroValue}>{currency(revenue)}</Text>
          <Text style={styles.heroSub}>{delivered.length} delivered orders</Text>
        </View>

        <View style={styles.row}>
          <Card icon="calendar" color={colors.info} value={currency(week)} label="Last 7 days" />
          <Card icon="calendar-outline" color="#7c3aed" value={currency(month)} label="Last 30 days" />
        </View>
        <View style={styles.row}>
          <Card icon="cart" color={colors.success} value={currency(aov)} label="Avg order" />
          <Card icon="close-circle" color={colors.danger} value={cancelled} label="Cancelled" />
        </View>

        <Text style={styles.sectionTitle}>Top Items</Text>
        {top.length ? top.map(([name, qty], i) => (
          <View key={name} style={styles.itemRow}>
            <View style={styles.rank}><Text style={styles.rankText}>{i + 1}</Text></View>
            <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
            <Text style={styles.itemQty}>{qty} sold</Text>
          </View>
        )) : <Text style={styles.empty}>No sales data yet</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ icon, color, value, label }) {
  return (
    <View style={styles.card}>
      <Icon name={icon} size={wp(5.5)} color={color} />
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export default enhancer(Analytics);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    padding: wp(5),
    paddingBottom: hp(4)
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: wp(5),
    padding: wp(6),
    marginBottom: hp(2)
  },
  heroLabel: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.white,
    opacity: 0.85
  },
  heroValue: {
    fontWeight: Bold,
    fontSize: wp(8),
    color: colors.white,
    marginVertical: hp(0.5)
  },
  heroSub: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.white,
    opacity: 0.85
  },
  row: {
    flexDirection: 'row',
    gap: wp(3),
    marginBottom: hp(1.5)
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: wp(3.5),
    padding: wp(4),
    gap: hp(0.5)
  },
  cardValue: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.txtDark
  },
  cardLabel: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary
  },
  sectionTitle: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark,
    marginTop: hp(1.5),
    marginBottom: hp(1.5)
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(3),
    padding: wp(3.5),
    marginBottom: hp(1)
  },
  rank: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3)
  },
  rankText: {
    fontWeight: Bold,
    fontSize: wp(3.4),
    color: colors.primaryDark
  },
  itemName: {
    flex: 1,
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  itemQty: {
    fontWeight: Bold,
    fontSize: wp(3.4),
    color: colors.txtSecondary
  },
  empty: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtTertiary,
    textAlign: 'center',
    marginTop: hp(2)
  }
});
