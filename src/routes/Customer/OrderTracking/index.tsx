import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, Medium } from '@fonts';
import { wp, hp, currency } from '@utils/utilities';
import { DEFAULT_REGION } from '@config/constant';
import { supabase } from '@library/supabase';
import { subscribeToOrder } from '@store/Orders/api';
import { getRiderLocation, subscribeToRiderLocation, getRoute } from '@library/location';
import OSMMap from '@components/map/OSMMap';
import StatusBadge from '@components/common/StatusBadge';
import NameAvatar from '@components/common/NameAvatar';
import { Button } from '@components/common';
import * as OrderActions from '@store/Orders/actions';
import * as RestaurantActions from '@store/Restaurants/actions';

const STEPS = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'];
const MESSAGES = {
  pending: { title: 'Order Placed!', sub: 'Waiting for restaurant confirmation', icon: '🕐' },
  accepted: { title: 'Order Accepted!', sub: 'Restaurant is getting ready', icon: '✅' },
  preparing: { title: 'Preparing Your Food', sub: 'Your food is being prepared', icon: '👨‍🍳' },
  ready: { title: 'Ready for Pickup', sub: 'Waiting for a rider', icon: '🛵' },
  picked_up: { title: 'On the Way!', sub: 'Your rider is heading your way', icon: '🏍️' },
  delivered: { title: 'Delivered!', sub: 'Enjoy your meal!', icon: '🎉' },
};

let enhancer = connect(null, { ...OrderActions, ...RestaurantActions });

function OrderTracking({ navigation, route, getOrder, getReviewByOrder }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [riderLoc, setRiderLoc] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [reviewed, setReviewed] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    getOrder(orderId).then(setOrder);
    getReviewByOrder(orderId).then((r) => setReviewed(!!r));
    const channel = subscribeToOrder(orderId, (updated) => setOrder((prev) => (prev ? { ...prev, ...updated } : prev)));
    return () => supabase.removeChannel(channel);
  }, [orderId]);

  const restaurant = order && order.restaurant && order.restaurant.latitude ? { latitude: order.restaurant.latitude, longitude: order.restaurant.longitude } : null;
  const dest = order && order.delivery_address && order.delivery_address.latitude ? { latitude: order.delivery_address.latitude, longitude: order.delivery_address.longitude } : null;

  useEffect(() => {
    if (restaurant && dest) {
      getRoute(restaurant, dest).then((coords) => {
        setRouteCoords(coords);
        setTimeout(() => mapRef.current && mapRef.current.fitToCoordinates([restaurant, dest]), 300);
      });
    }
  }, [restaurant && restaurant.latitude, dest && dest.latitude]);

  useEffect(() => {
    if (!order || !order.rider_id) return;
    getRiderLocation(order.rider_id).then(setRiderLoc);
    const channel = subscribeToRiderLocation(order.rider_id, (loc) => {
      setRiderLoc(loc);
      mapRef.current && mapRef.current.animateToRegion({ latitude: loc.latitude, longitude: loc.longitude });
    });
    return () => supabase.removeChannel(channel);
  }, [order && order.rider_id]);

  const msg = MESSAGES[(order && order.status) || 'pending'];
  const step = STEPS.indexOf((order && order.status) || 'pending');

  const markers = [];
  if (restaurant) markers.push({ lat: restaurant.latitude, lng: restaurant.longitude, type: 'restaurant', emoji: '🍴' });
  if (dest) markers.push({ lat: dest.latitude, lng: dest.longitude, type: 'customer' });
  if (riderLoc) markers.push({ lat: riderLoc.latitude, lng: riderLoc.longitude, type: 'rider', emoji: '🏍️' });

  return (
    <View style={styles.container}>
      <OSMMap ref={mapRef} style={styles.map} center={dest || restaurant || DEFAULT_REGION} zoom={14} markers={markers} polyline={routeCoords} />
      <SafeAreaView style={styles.backWrap} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={wp(5)} color={colors.txtDark} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.statusHeader}>
          <Text style={styles.emoji}>{msg.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{msg.title}</Text>
            <Text style={styles.statusSub}>{msg.sub}</Text>
          </View>
          <StatusBadge status={(order && order.status) || 'pending'} />
        </View>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]} />
              {i < STEPS.length - 1 ? <View style={[styles.stepLine, i < step && styles.stepLineActive]} /> : null}
            </React.Fragment>
          ))}
        </View>

        {order && order.rider ? (
          <View style={styles.riderCard}>
            <NameAvatar name={order.rider.full_name} uri={order.rider.avatar_url} size={wp(11)} />
            <View style={{ flex: 1, marginLeft: wp(3) }}>
              <Text style={styles.riderName}>{order.rider.full_name}</Text>
              <Text style={styles.riderRole}>Your Delivery Rider</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => order.rider.phone && Linking.openURL(`tel:${order.rider.phone}`)}>
              <Icon name="call" size={wp(4.5)} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Chat', { orderId, otherName: order.rider.full_name })}>
              <Icon name="chatbubble-outline" size={wp(4.5)} color={colors.dark700} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.orderInfo}>
          <Text style={styles.orderNum}>Order #{order && order.order_number}</Text>
          <Text style={styles.orderTotal}>{currency(order && order.total_amount)}</Text>
        </View>

        {order && order.status === 'delivered' ? (
          reviewed ? (
            <View style={styles.reviewed}><Icon name="checkmark-circle" size={wp(4.5)} color={colors.success} /><Text style={styles.reviewedText}>You rated this order</Text></View>
          ) : (
            <Button label="Rate Your Experience ⭐" variant="outline" onPress={() => navigation.navigate('ReviewOrder', { orderId })} />
          )
        ) : null}
      </View>
    </View>
  );
}

export default enhancer(OrderTracking);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2)
  },
  emoji: {
    fontSize: wp(8),
    marginRight: wp(3)
  },
  statusTitle: {
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.txtDark
  },
  statusSub: {
    fontWeight: Regular,
    fontSize: wp(3.3),
    color: colors.txtSecondary,
    marginTop: 2
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2)
  },
  stepDot: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.25),
    backgroundColor: colors.border
  },
  stepDotActive: {
    backgroundColor: colors.primary
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border
  },
  stepLineActive: {
    backgroundColor: colors.primary
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: wp(4),
    padding: wp(3.5),
    marginBottom: hp(2)
  },
  riderName: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  riderRole: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary
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
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2)
  },
  orderNum: {
    fontWeight: Regular,
    fontSize: wp(3.3),
    color: colors.txtSecondary
  },
  orderTotal: {
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.txtDark
  },
  reviewed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    backgroundColor: colors.successSoft,
    borderRadius: wp(3),
    paddingVertical: hp(1.6)
  },
  reviewedText: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.successDark
  }
});
