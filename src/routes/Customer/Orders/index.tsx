import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import { Image } from 'expo-image';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { format } from 'date-fns';
import { EmptyState } from '@components/common';
import StatusBadge from '@components/common/StatusBadge';
import * as OrderActions from '@store/Orders/actions';

const TABS = ['All', 'Active', 'Completed'];

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...OrderActions });

function Orders({ navigation, user, getCustomerOrders }) {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('All');

  useFocusEffect(
    useCallback(() => {
      if (user) getCustomerOrders(user.id).then(setOrders);
    }, [user]),
  );

  const filtered = orders.filter((o) => {
    if (tab === 'Active') return !['delivered', 'cancelled', 'refunded'].includes(o.status);
    if (tab === 'Completed') return o.status === 'delivered';
    return true;
  });

  const isActive = (s) => !['delivered', 'cancelled', 'refunded'].includes(s);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>My Orders</Text>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders yet" description="Place your first order and it'll appear here" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate(isActive(item.status) ? 'OrderTracking' : 'OrderDetail', { orderId: item.id })}
          >
            <View style={styles.cardHeader}>
              {item.restaurant && item.restaurant.logo_url ? <Image source={{ uri: item.restaurant.logo_url }} style={styles.logo} contentFit="cover" /> : <View style={styles.logo} />}
              <View style={{ flex: 1, marginLeft: wp(3) }}>
                <Text style={styles.restaurant}>{item.restaurant && item.restaurant.name}</Text>
                <Text style={styles.date}>{format(new Date(item.created_at), 'MMM d, h:mm a')}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.orderNum}>#{item.order_number}</Text>
              <Text style={styles.total}>{currency(item.total_amount)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

export default enhancer(Orders);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(6.5),
    color: colors.txtDark,
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5)
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    gap: wp(2)
  },
  tab: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.9),
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
    fontSize: wp(3.4),
    color: colors.dark600
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: Bold
  },
  list: {
    padding: wp(5),
    gap: hp(1.5)
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(4)
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.2)
  },
  logo: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(3),
    backgroundColor: colors.surface
  },
  restaurant: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  date: {
    fontWeight: Regular,
    fontSize: wp(2.9),
    color: colors.txtSecondary,
    marginTop: 2
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: hp(1.2)
  },
  orderNum: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary
  },
  total: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark
  }
});
