import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { DEFAULT_REGION } from '@config/constant';
import { getRoute, startLocationTracking, updateRiderLocation, calculateDistance } from '@library/location';
import OSMMap from '@components/map/OSMMap';
import NameAvatar from '@components/common/NameAvatar';
import { EmptyState } from '@components/common';
import * as OrderActions from '@store/Orders/actions';
import * as RiderActions from '@store/Rider/actions';

const STEP = {
  ready: { label: 'Mark as Picked Up', next: 'picked_up', target: 'restaurant', hint: 'Head to the restaurant' },
  picked_up: { label: 'Mark as Delivered', next: 'delivered', target: 'customer', hint: 'Deliver to the customer' },
};

let connectState = (state) => ({ user: state.Auth.auth.get('user') });
let enhancer = connect(connectState, { ...OrderActions, ...RiderActions });

function ActiveDelivery({ navigation, user, getRiderActiveDelivery, updateOrderStatus, getPayoutRates }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeCoords, setRouteCoords] = useState([]);
  const [riderLoc, setRiderLoc] = useState(null);
  const [rates, setRates] = useState(null);
  const mapRef = useRef(null);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getRiderActiveDelivery(user.id);
    setOrder(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { getPayoutRates().then(setRates); }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return undefined;
    const stop = startLocationTracking((coords) => {
      setRiderLoc(coords);
      updateRiderLocation(user.id, coords);
    });
    return stop;
  }, [user]);

  const restaurant = order && order.restaurant && order.restaurant.latitude ? { latitude: order.restaurant.latitude, longitude: order.restaurant.longitude } : null;
  const dest = order && order.delivery_address && order.delivery_address.latitude ? { latitude: order.delivery_address.latitude, longitude: order.delivery_address.longitude } : null;
  const step = order ? STEP[order.status] : null;
  const targetPoint = step && step.target === 'customer' ? dest : restaurant;

  const actualPayout = Number((order && order.rider_payout) || 0);
  let estimatedPayout = actualPayout;
  if (!actualPayout && rates && restaurant && dest) {
    estimatedPayout = Math.round((rates.basePay + rates.perKm * calculateDistance(restaurant, dest)) * 100) / 100;
  }

  useEffect(() => {
    const from = riderLoc || restaurant;
    if (from && targetPoint) {
      getRoute(from, targetPoint).then((coords) => {
        setRouteCoords(coords);
        setTimeout(() => mapRef.current && mapRef.current.fitToCoordinates([from, targetPoint]), 300);
      });
    }
  }, [riderLoc && riderLoc.latitude, targetPoint && targetPoint.latitude]);

  const advance = () => {
    if (!step) return;
    Alert.alert('Confirm', step.label + '?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          await updateOrderStatus(order.id, step.next);
          if (step.next === 'delivered') {
            Alert.alert('Delivered!', 'Great job! Payout added to your earnings.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          } else {
            load();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}><ActivityIndicator color={colors.primary} /></SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Icon name="arrow-back" size={wp(5)} color={colors.txtDark} /></TouchableOpacity>
          <Text style={styles.topTitle}>Active Delivery</Text>
          <View style={{ width: wp(10) }} />
        </View>
        <EmptyState icon="cube-outline" title="No active delivery" description="Accept a delivery to get started" />
      </SafeAreaView>
    );
  }

  const markers = [];
  if (restaurant) markers.push({ lat: restaurant.latitude, lng: restaurant.longitude, type: 'restaurant', emoji: '🍴' });
  if (dest) markers.push({ lat: dest.latitude, lng: dest.longitude, type: 'customer' });
  if (riderLoc) markers.push({ lat: riderLoc.latitude, lng: riderLoc.longitude, type: 'rider', emoji: '🏍️' });

  const customer = order.customer;

  return (
    <View style={styles.container}>
      <OSMMap ref={mapRef} style={styles.map} center={targetPoint || DEFAULT_REGION} zoom={14} markers={markers} polyline={routeCoords} />
      <SafeAreaView style={styles.backWrap} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Icon name="arrow-back" size={wp(5)} color={colors.txtDark} /></TouchableOpacity>
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.hintRow}>
          <Icon name="navigate" size={wp(5)} color={colors.primary} />
          <Text style={styles.hint}>{step ? step.hint : 'Delivery complete'}</Text>
        </View>

        <View style={styles.personCard}>
          <NameAvatar name={customer && customer.full_name} size={wp(11)} />
          <View style={{ flex: 1, marginLeft: wp(3) }}>
            <Text style={styles.personName}>{customer && customer.full_name}</Text>
            <Text style={styles.personRole}>Customer · #{order.order_number}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => customer && customer.phone && Linking.openURL(`tel:${customer.phone}`)}>
            <Icon name="call" size={wp(4.5)} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Chat', { orderId: order.id, otherName: customer && customer.full_name })}>
            <Icon name="chatbubble-outline" size={wp(4.5)} color={colors.dark700} />
          </TouchableOpacity>
        </View>

        <View style={styles.addressRow}>
          <Icon name={step && step.target === 'customer' ? 'home-outline' : 'restaurant-outline'} size={wp(4.5)} color={colors.txtSecondary} />
          <Text style={styles.address} numberOfLines={2}>
            {step && step.target === 'customer'
              ? (order.delivery_address && order.delivery_address.address_line1)
              : (order.restaurant && order.restaurant.address)}
          </Text>
        </View>

        <View style={styles.payRow}>
          <Text style={styles.payLabel}>{actualPayout ? 'Your Payout' : 'Estimated Payout'}</Text>
          <Text style={styles.payValue}>{currency(actualPayout || estimatedPayout)}</Text>
        </View>

        {step ? (
          <TouchableOpacity style={styles.advanceBtn} onPress={advance}>
            <Text style={styles.advanceText}>{step.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default enhancer(ActiveDelivery);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  map: {
    flex: 1
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: colors.white
  },
  topTitle: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark
  },
  backWrap: {
    position: 'absolute',
    top: 0,
    left: 0
  },
  backBtn: {
    margin: wp(4),
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(7),
    borderTopRightRadius: wp(7),
    padding: wp(6),
    paddingBottom: hp(4)
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(2)
  },
  hint: {
    fontWeight: Bold,
    fontSize: wp(4.2),
    color: colors.txtDark
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: wp(4),
    padding: wp(3.5),
    marginBottom: hp(1.5)
  },
  personName: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  personRole: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary,
    marginTop: 2
  },
  iconBtn: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(2)
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(1.5)
  },
  address: {
    flex: 1,
    fontWeight: Regular,
    fontSize: wp(3.3),
    color: colors.dark700
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2)
  },
  payLabel: {
    fontWeight: Medium,
    fontSize: wp(3.5),
    color: colors.txtSecondary
  },
  payValue: {
    fontWeight: Bold,
    fontSize: wp(5),
    color: colors.success
  },
  advanceBtn: {
    backgroundColor: colors.primary,
    borderRadius: wp(3),
    paddingVertical: hp(1.8),
    alignItems: 'center'
  },
  advanceText: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.white
  }
});
