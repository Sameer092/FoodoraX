import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { calculateDistance } from '@library/location';
import { EmptyState } from '@components/common';
import * as OrderActions from '@store/Orders/actions';
import * as UserActions from '@store/Users/actions';
import * as RiderActions from '@store/Rider/actions';

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...OrderActions, ...UserActions, ...RiderActions });

function payoutOf(order, rates) {
  const actual = Number((order && order.rider_payout) || 0);
  if (actual) return actual;
  const r = order && order.restaurant;
  const d = order && order.delivery_address;
  if (!rates || !r || !r.latitude || !d || !d.latitude) return 0;
  const dist = calculateDistance({ latitude: r.latitude, longitude: r.longitude }, { latitude: d.latitude, longitude: d.longitude });
  return Math.round((rates.basePay + rates.perKm * dist) * 100) / 100;
}

function RiderDashboard({ navigation, user, getStatus, setStatus, getRiderToday, getAvailableDeliveries, getRiderActiveDelivery, acceptDelivery, getPayoutRates }) {
  const [online, setOnline] = useState(false);
  const [verified, setVerified] = useState(true);
  const [stats, setStats] = useState({ todayCount: 0, todayEarnings: 0, rating: 0 });
  const [active, setActive] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [rates, setRates] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [status, today, act] = await Promise.all([
      getStatus(user.id),
      getRiderToday(user.id),
      getRiderActiveDelivery(user.id),
    ]);
    setOnline(status.status !== 'offline');
    setVerified(!!status.is_verified);
    setStats(today);
    setActive(act);
    if (status.status !== 'offline' && !act) setDeliveries(await getAvailableDeliveries());
    else setDeliveries([]);
  }, [user]);

  useEffect(() => { getPayoutRates().then(setRates); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleOnline = async (value) => {
    setOnline(value);
    await setStatus(user.id, value ? 'online' : 'offline');
    load();
  };

  const accept = (order) => {
    Alert.alert('Accept Delivery', `Pick up order #${order.order_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: async () => { await acceptDelivery(order.id, user.id); navigation.navigate('ActiveDelivery'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp(4) }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hi}>Hi, {user && user.full_name ? user.full_name.split(' ')[0] : 'Rider'}</Text>
            <Text style={[styles.statusText, { color: online ? colors.success : colors.txtTertiary }]}>{online ? '● Online' : '○ Offline'}</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Profile')}>
            <Icon name="person-outline" size={wp(5.5)} color={colors.dark800} />
          </TouchableOpacity>
        </View>

        {!verified ? (
          <View style={styles.pending}>
            <Icon name="hourglass-outline" size={wp(5)} color={colors.warningDark} />
            <View style={{ flex: 1, marginLeft: wp(3) }}>
              <Text style={styles.pendingTitle}>Pending Verification</Text>
              <Text style={styles.pendingText}>An admin needs to verify your account before you can accept deliveries.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.toggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>{online ? 'You are online' : 'Go online'}</Text>
            <Text style={styles.toggleSub}>{online ? 'Receiving delivery requests' : 'Turn on to receive requests'}</Text>
          </View>
          <Switch value={online} onValueChange={toggleOnline} disabled={!verified} trackColor={{ false: colors.border, true: colors.success }} thumbColor={colors.white} />
        </View>

        <View style={styles.stats}>
          <Stat icon="bicycle" color={colors.primary} value={stats.todayCount} label="Today" />
          <Stat icon="cash" color={colors.success} value={`$${Number(stats.todayEarnings).toFixed(0)}`} label="Earned" />
          <Stat icon="star" color={colors.golden} value={Number(stats.rating).toFixed(1)} label="Rating" />
        </View>

        <TouchableOpacity style={styles.earningsBtn} onPress={() => navigation.navigate('Earnings')}>
          <Icon name="wallet-outline" size={wp(5)} color={colors.primary} />
          <Text style={styles.earningsText}>View Earnings History</Text>
          <Icon name="chevron-forward" size={wp(4.5)} color={colors.txtTertiary} />
        </TouchableOpacity>

        {active ? (
          <>
            <Text style={styles.sectionTitle}>Active Delivery</Text>
            <TouchableOpacity style={styles.activeCard} onPress={() => navigation.navigate('ActiveDelivery')}>
              <View style={styles.activeIcon}><Icon name="navigate" size={wp(6)} color={colors.white} /></View>
              <View style={{ flex: 1, marginLeft: wp(3) }}>
                <Text style={styles.activeNum}>#{active.order_number}</Text>
                <Text style={styles.activeRest}>{active.restaurant && active.restaurant.name}</Text>
              </View>
              <Text style={styles.activePay}>{currency(payoutOf(active, rates))}</Text>
            </TouchableOpacity>
          </>
        ) : online ? (
          <>
            <Text style={styles.sectionTitle}>Available Deliveries</Text>
            {deliveries.length ? deliveries.map((o) => (
              <View key={o.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderNum}>#{o.order_number}</Text>
                  <Text style={styles.pay}>{currency(payoutOf(o, rates))}</Text>
                </View>
                <Row icon="restaurant-outline" text={o.restaurant && o.restaurant.name} />
                <Row icon="location-outline" text={o.delivery_address && o.delivery_address.address_line1} />
                {o.restaurant && o.delivery_address && o.restaurant.latitude && o.delivery_address.latitude ? (
                  <Row icon="navigate-outline" text={`${calculateDistance({ latitude: o.restaurant.latitude, longitude: o.restaurant.longitude }, { latitude: o.delivery_address.latitude, longitude: o.delivery_address.longitude }).toFixed(1)} km`} />
                ) : null}
                <TouchableOpacity style={styles.acceptBtn} onPress={() => accept(o)}>
                  <Text style={styles.acceptText}>Accept Delivery</Text>
                </TouchableOpacity>
              </View>
            )) : <EmptyState icon="cube-outline" title="No deliveries available" description="New requests will appear here" />}
          </>
        ) : (
          <EmptyState icon="power-outline" title="You're offline" description="Go online to start receiving deliveries" />
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

function Row({ icon, text }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={wp(4)} color={colors.txtTertiary} />
      <Text style={styles.rowText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

export default enhancer(RiderDashboard);

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
  hi: {
    fontWeight: Bold,
    fontSize: wp(5.5),
    color: colors.txtDark
  },
  statusText: {
    fontWeight: Medium,
    fontSize: wp(3.3),
    marginTop: 2
  },
  headerBtn: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
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
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: wp(5),
    marginTop: hp(1.5),
    borderRadius: wp(4),
    padding: wp(4.5)
  },
  toggleTitle: {
    fontWeight: Bold,
    fontSize: wp(4.2),
    color: colors.txtDark
  },
  toggleSub: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.txtSecondary,
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
  earningsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: colors.white,
    marginHorizontal: wp(5),
    borderRadius: wp(3.5),
    padding: wp(4)
  },
  earningsText: {
    flex: 1,
    fontWeight: Medium,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  sectionTitle: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark,
    paddingHorizontal: wp(5),
    marginTop: hp(2.5),
    marginBottom: hp(1.5)
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(4),
    marginHorizontal: wp(5),
    marginBottom: hp(1.5)
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1)
  },
  orderNum: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark
  },
  pay: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.success
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(0.7)
  },
  rowText: {
    flex: 1,
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.dark600
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: wp(2.5),
    paddingVertical: hp(1.4),
    alignItems: 'center',
    marginTop: hp(1)
  },
  acceptText: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.white
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: wp(5),
    borderRadius: wp(4),
    padding: wp(4),
    borderWidth: 1.5,
    borderColor: colors.primary
  },
  activeIcon: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(3),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeNum: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark
  },
  activeRest: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.txtSecondary,
    marginTop: 2
  },
  activePay: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.success
  }
});
