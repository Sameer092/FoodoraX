import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
// PROVIDER_GOOGLE removed — using default provider (free, no API key needed for dev)
import { Image } from 'expo-image';
import { useOrderWithRealtime } from '@hooks/useOrders';
import { useOrderReview } from '@hooks/useRestaurants';
import { locationService } from '@services/location.service';
import { supabase } from '@services/supabase';
import { useAppStore } from '@store/app.store';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { Colors } from '@constants/colors';
import type { RiderLocation, OrderStatus } from '@types/index';

const { width, height } = Dimensions.get('window');

const STATUS_STEPS: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'];

const STATUS_MESSAGES: Record<string, { title: string; subtitle: string; icon: string }> = {
  pending:   { title: 'Order Placed!',       subtitle: 'Waiting for restaurant confirmation', icon: '🕐' },
  accepted:  { title: 'Order Accepted!',     subtitle: 'Restaurant is getting ready',         icon: '✅' },
  preparing: { title: 'Preparing Your Food', subtitle: 'Your food is being prepared',          icon: '👨‍🍳' },
  ready:     { title: 'Ready for Pickup',    subtitle: 'Waiting for a rider',                  icon: '🛵' },
  picked_up: { title: 'On the Way!',         subtitle: 'Your rider is heading your way',       icon: '🏍️' },
  delivered: { title: 'Delivered!',          subtitle: 'Enjoy your meal!',                     icon: '🎉' },
};

export function OrderTrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;
  const { data: order, isLoading } = useOrderWithRealtime(orderId);
  const { data: existingReview } = useOrderReview(orderId);
  const { currentLocation } = useAppStore();
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const mapRef = useRef<MapView>(null);

  // Center the map on the delivery location (your real address) once it loads
  useEffect(() => {
    const dest = order?.delivery_address;
    if (dest?.latitude && dest?.longitude) {
      mapRef.current?.animateToRegion({
        latitude: dest.latitude, longitude: dest.longitude,
        latitudeDelta: 0.04, longitudeDelta: 0.04,
      });
    }
  }, [order?.delivery_address?.latitude, order?.delivery_address?.longitude]);

  useEffect(() => {
    if (!order?.rider_id) return;
    const initial = async () => {
      const loc = await locationService.getRiderLocation(order.rider_id!);
      setRiderLocation(loc);
    };
    initial();
    const channel = locationService.subscribeToRiderLocation(order.rider_id, (loc) => {
      setRiderLocation(loc);
      mapRef.current?.animateToRegion({
        latitude: loc.latitude, longitude: loc.longitude,
        latitudeDelta: 0.02, longitudeDelta: 0.02,
      });
    });
    return () => { supabase.removeChannel(channel); };
  }, [order?.rider_id]);

  const statusMsg = STATUS_MESSAGES[order?.status ?? 'pending'];
  const currentStep = STATUS_STEPS.indexOf(order?.status as OrderStatus ?? 'pending');

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: order?.delivery_address?.latitude ?? riderLocation?.latitude ?? currentLocation?.latitude ?? 24.8607,
          longitude: order?.delivery_address?.longitude ?? riderLocation?.longitude ?? currentLocation?.longitude ?? 67.0011,
          latitudeDelta: 0.05, longitudeDelta: 0.05,
        }}
      >
        {riderLocation && (
          <Marker coordinate={{ latitude: riderLocation.latitude, longitude: riderLocation.longitude }}>
            <View style={styles.riderMarker}>
              <Text style={{ fontSize: 20 }}>🏍️</Text>
            </View>
          </Marker>
        )}
        {order?.delivery_address?.latitude && (
          <Marker coordinate={{
            latitude: order.delivery_address.latitude,
            longitude: order.delivery_address.longitude,
          }}>
            <View style={styles.destMarker}>
              <Ionicons name="location" size={20} color={Colors.white} />
            </View>
          </Marker>
        )}
        {order?.restaurant?.latitude && (
          <Marker coordinate={{
            latitude: order.restaurant.latitude,
            longitude: order.restaurant.longitude,
          }}>
            <View style={styles.restaurantMarker}>
              <Text style={{ fontSize: 16 }}>🍴</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Back button */}
      <SafeAreaView style={styles.backBtn} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color={Colors.dark[900]} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        {/* Status */}
        <View style={styles.statusHeader}>
          <Text style={styles.statusEmoji}>{statusMsg?.icon}</Text>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{statusMsg?.title}</Text>
            <Text style={styles.statusSubtitle}>{statusMsg?.subtitle}</Text>
          </View>
          <OrderStatusBadge status={order?.status ?? 'pending'} size="sm" />
        </View>

        {/* Progress Steps */}
        <View style={styles.steps}>
          {STATUS_STEPS.slice(0, 6).map((step, i) => (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, i <= currentStep && styles.stepDotActive]} />
                <Text style={[styles.stepLabel, i <= currentStep && styles.stepLabelActive]}>
                  {step.replace('_', ' ')}
                </Text>
              </View>
              {i < 5 && <View style={[styles.stepLine, i < currentStep && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Rider Info */}
        {order?.rider && (
          <View style={styles.riderCard}>
            {order.rider.avatar_url ? (
              <Image source={{ uri: order.rider.avatar_url }} style={styles.riderAvatar} contentFit="cover" />
            ) : (
              <View style={styles.riderAvatarPlaceholder}>
                <Text style={styles.riderInitial}>{order.rider.full_name?.[0]}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.riderName}>{order.rider.full_name}</Text>
              <Text style={styles.riderRole}>Your Delivery Rider</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => order?.rider?.phone && Linking.openURL(`tel:${order.rider.phone}`)}
            >
              <Ionicons name="call" size={18} color={Colors.primary[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.msgBtn}
              onPress={() => navigation.navigate('Chat', { orderId, otherName: order?.rider?.full_name })}
            >
              <Ionicons name="chatbubble-outline" size={18} color={Colors.dark[700]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Order info */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{order?.order_number}</Text>
          <Text style={styles.orderTotal}>${order?.total_amount?.toFixed(2)}</Text>
        </View>

        {order?.status === 'delivered' && (
          existingReview ? (
            <View style={styles.reviewedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />
              <Text style={styles.reviewedText}>You rated this order {existingReview.overall_rating}★</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => navigation.navigate('ReviewOrder', { orderId })}
            >
              <Text style={styles.reviewBtnText}>Rate Your Experience ⭐</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  backBtn: { position: 'absolute', top: 0, left: 0 },
  backCircle: {
    margin: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 10,
  },
  statusHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  statusEmoji: { fontSize: 32 },
  statusText: { flex: 1 },
  statusTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  statusSubtitle: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  steps: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    paddingHorizontal: 4,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.light.border, borderWidth: 2, borderColor: Colors.light.border,
  },
  stepDotActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  stepLabel: { fontSize: 8, color: Colors.light.textTertiary, textAlign: 'center', maxWidth: 40 },
  stepLabelActive: { color: Colors.primary[600], fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.light.border, marginBottom: 14 },
  stepLineActive: { backgroundColor: Colors.primary[500] },
  riderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.light.surface, borderRadius: 16,
    padding: 14, marginBottom: 16,
  },
  riderAvatar: { width: 48, height: 48, borderRadius: 24 },
  riderAvatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  riderInitial: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  riderName: { fontSize: 15, fontWeight: '700', color: Colors.dark[900] },
  riderRole: { fontSize: 12, color: Colors.light.textSecondary },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  msgBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.light.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderNumber: { fontSize: 13, color: Colors.light.textSecondary },
  orderTotal: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  riderMarker: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  destMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  restaurantMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary[500],
  },
  reviewBtn: {
    backgroundColor: Colors.primary[50], borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primary[200],
  },
  reviewBtnText: { fontSize: 15, fontWeight: '700', color: Colors.primary[600] },
  reviewedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#dcfce7', borderRadius: 12, paddingVertical: 14,
  },
  reviewedText: { fontSize: 14, fontWeight: '700', color: '#166534' },
});
