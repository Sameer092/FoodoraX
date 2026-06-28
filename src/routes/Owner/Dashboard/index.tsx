import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import StatusBadge from '@components/common/StatusBadge';
import * as RestaurantActions from '@store/Restaurants/actions';
import * as OrderActions from '@store/Orders/actions';

const ACTIONS = [
  { label: 'Orders', icon: 'receipt', bg: '#dbeafe', color: '#1d4ed8', route: 'OrderManagement' },
  { label: 'Menu', icon: 'restaurant', bg: colors.successSoft, color: '#15803d', route: 'MenuManagement' },
  { label: 'Analytics', icon: 'bar-chart', bg: colors.warningSoft, color: '#b45309', route: 'Analytics' },
  { label: 'Settings', icon: 'settings', bg: '#fce7f3', color: '#9d174d', route: 'RestaurantSettings' },
];

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...RestaurantActions, ...OrderActions });

function OwnerDashboard({ navigation, user, getRestaurantsByOwner, getOrdersByRestaurants }) {
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    if (!user) return;
    const rests = await getRestaurantsByOwner(user.id);
    setRestaurants(rests);
    if (rests.length) setOrders(await getOrdersByRestaurants(rests.map((r) => r.id)));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const first = restaurants[0];
  const ids = restaurants.map((r) => r.id);
  const pending = orders.filter((o) => o.status === 'pending');
  const active = orders.filter((o) => ['accepted', 'preparing', 'ready', 'picked_up'].includes(o.status));
  const today = new Date().toDateString();
  const todayRevenue = orders.filter((o) => o.status === 'delivered' && new Date(o.created_at).toDateString() === today).reduce((s, o) => s + o.total_amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp(4) }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.restaurant}>{first ? first.name : 'Your Restaurant'}</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Profile')}>
            <Icon name="person-outline" size={wp(5.5)} color={colors.dark800} />
          </TouchableOpacity>
        </View>

        {!first ? (
          <TouchableOpacity style={styles.createCard} onPress={() => navigation.navigate('CreateRestaurant')}>
            <Icon name="add-circle" size={wp(12)} color={colors.primary} />
            <Text style={styles.createTitle}>Create Your Restaurant</Text>
            <Text style={styles.createSub}>Set up your restaurant profile to start</Text>
          </TouchableOpacity>
        ) : (
          <>
            {!first.is_verified ? (
              <View style={styles.pending}>
                <Icon name="hourglass-outline" size={wp(5)} color={colors.warningDark} />
                <View style={{ flex: 1, marginLeft: wp(3) }}>
                  <Text style={styles.pendingTitle}>Pending Admin Approval</Text>
                  <Text style={styles.pendingText}>Your restaurant isn't visible to customers yet. Set up your menu while you wait.</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.stats}>
              <Stat icon="time" color={colors.warning} value={pending.length} label="Pending" />
              <Stat icon="flame" color={colors.primary} value={active.length} label="Active" />
              <Stat icon="cash" color={colors.success} value={`$${todayRevenue.toFixed(0)}`} label="Today" />
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actions}>
              {ACTIONS.map((a) => (
                <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.route, { restaurantId: first.id, restaurantIds: ids })}>
                  <View style={[styles.actionIcon, { backgroundColor: a.bg }]}><Icon name={a.icon} size={wp(5.5)} color={a.color} /></View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                  {a.label === 'Orders' && pending.length ? <View style={styles.badge}><Text style={styles.badgeText}>{pending.length}</Text></View> : null}
                </TouchableOpacity>
              ))}
            </View>

            {pending.length ? (
              <>
                <Text style={styles.sectionTitle}>Pending Orders</Text>
                {pending.slice(0, 3).map((o) => (
                  <TouchableOpacity key={o.id} style={styles.orderCard} onPress={() => navigation.navigate('OrderManagement', { restaurantId: first.id, restaurantIds: ids })}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderNum}>#{o.order_number}</Text>
                      <Text style={styles.customer}>{o.customer && o.customer.full_name}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.total}>{currency(o.total_amount)}</Text>
                      <StatusBadge status={o.status} />
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, color, value, label }) {
  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={wp(5.5)} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default enhancer(OwnerDashboard);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: colors.white
  },
  greeting: {
    fontWeight: Regular,
    fontSize: wp(3.3),
    color: colors.txtSecondary
  },
  restaurant: {
    fontWeight: Bold,
    fontSize: wp(5.5),
    color: colors.txtDark
  },
  headerBtn: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  createCard: {
    margin: wp(5),
    backgroundColor: colors.white,
    borderRadius: wp(5),
    padding: wp(10),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primaryDim,
    borderStyle: 'dashed'
  },
  createTitle: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.txtDark,
    marginTop: hp(1)
  },
  createSub: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtSecondary,
    textAlign: 'center',
    marginTop: hp(0.5)
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    marginHorizontal: wp(5),
    marginTop: hp(1.5),
    borderRadius: wp(4),
    padding: wp(4)
  },
  pendingTitle: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.warningDark
  },
  pendingText: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.warningDark,
    marginTop: 2
  },
  stats: {
    flexDirection: 'row',
    gap: wp(2.5),
    padding: wp(5)
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: wp(3.5),
    padding: wp(3.5),
    alignItems: 'center',
    gap: hp(0.5)
  },
  statValue: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.txtDark
  },
  statLabel: {
    fontWeight: Regular,
    fontSize: wp(2.7),
    color: colors.txtSecondary
  },
  sectionTitle: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark,
    paddingHorizontal: wp(5),
    marginTop: hp(1),
    marginBottom: hp(1.5)
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: hp(1.5),
    paddingHorizontal: wp(5)
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: wp(3.5),
    padding: wp(4),
    alignItems: 'center',
    gap: hp(1)
  },
  actionIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(3.5),
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionLabel: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.dark800
  },
  badge: {
    position: 'absolute',
    top: wp(2.5),
    right: wp(2.5),
    minWidth: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1)
  },
  badgeText: {
    fontWeight: Bold,
    fontSize: wp(2.6),
    color: colors.white
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: wp(5),
    borderRadius: wp(3.5),
    padding: wp(4),
    marginBottom: hp(1)
  },
  orderNum: {
    fontWeight: Bold,
    fontSize: wp(3.4),
    color: colors.txtDark
  },
  customer: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.dark600,
    marginTop: 2
  },
  total: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark,
    marginBottom: hp(0.5)
  }
});
