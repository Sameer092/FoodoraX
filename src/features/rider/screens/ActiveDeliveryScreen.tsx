import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useOrderWithRealtime, useUpdateOrderStatus } from '@hooks/useOrders';
import { useRiderLocationTracking } from '@hooks/useLocation';
import { locationService } from '@services/location.service';
import { useAuthStore } from '@store/auth.store';
import { useAppStore } from '@store/app.store';
import { OSMMap, OSMMapHandle, MapMarker } from '@components/map/OSMMap';
import { OrderStatusBadge } from '@components/order/OrderStatusBadge';
import { Button } from '@components/common/Button';
import { Colors } from '@constants/colors';
import { DEFAULT_REGION } from '@constants/config';
import type { Coordinates } from '@types/index';

export function ActiveDeliveryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;
  const { user } = useAuthStore();
  const { currentLocation } = useAppStore();
  const { data: order } = useOrderWithRealtime(orderId);
  const updateStatus = useUpdateOrderStatus();
  const mapRef = useRef<OSMMapHandle>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinates[]>([]);

  const restaurant = order?.restaurant?.latitude
    ? { latitude: order.restaurant.latitude!, longitude: order.restaurant.longitude! }
    : null;
  const destination = order?.delivery_address?.latitude
    ? { latitude: order.delivery_address.latitude!, longitude: order.delivery_address.longitude! }
    : null;

  useEffect(() => {
    if (!restaurant || !destination) return;
    let mounted = true;
    locationService.getRoute(restaurant, destination).then((coords) => {
      if (!mounted) return;
      setRouteCoords(coords);
      setTimeout(() => mapRef.current?.fitToCoordinates([restaurant, destination]), 300);
    });
    return () => { mounted = false; };
  }, [restaurant?.latitude, restaurant?.longitude, destination?.latitude, destination?.longitude]);

  useRiderLocationTracking(user?.id, true);

  const getNextStatus = () => {
    if (order?.status === 'ready') return { label: 'Mark as Picked Up', next: 'picked_up' };
    if (order?.status === 'picked_up') return { label: 'Mark as Delivered', next: 'delivered' };
    return null;
  };

  const nextAction = getNextStatus();

  const handleUpdateStatus = async () => {
    if (!nextAction) return;
    Alert.alert('Update Status', `Mark order as "${nextAction.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          await updateStatus.mutateAsync({ orderId, status: nextAction.next as any });
          if (nextAction.next === 'delivered') {
            navigation.replace('RiderDashboard');
          }
        },
      },
    ]);
  };

  const openMaps = (lat?: number, lon?: number, label = '') => {
    if (!lat || !lon) return;
    const url = `https://maps.google.com/?q=${lat},${lon}`;
    Linking.openURL(url);
  };

  const markers: MapMarker[] = [];
  if (restaurant) markers.push({ lat: restaurant.latitude, lng: restaurant.longitude, type: 'restaurant', emoji: '🍴' });
  if (destination) markers.push({ lat: destination.latitude, lng: destination.longitude, type: 'customer' });

  const mapCenter: Coordinates = restaurant ?? destination ?? currentLocation ?? DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <OSMMap
        ref={mapRef}
        style={styles.map}
        center={mapCenter}
        zoom={13}
        markers={markers}
        polyline={routeCoords}
      />

      {/* Back */}
      <SafeAreaView style={styles.backWrapper} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.dark[900]} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        {/* Order Info */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNum}>#{order?.order_number}</Text>
            <Text style={styles.itemsCount}>{order?.items?.length ?? 0} items</Text>
          </View>
          <OrderStatusBadge status={order?.status ?? 'pending'} />
        </View>

        {/* Restaurant */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={() => openMaps(order?.restaurant?.latitude, order?.restaurant?.longitude)}
        >
          <View style={[styles.locationDot, { backgroundColor: Colors.primary[500] }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Pickup from</Text>
            <Text style={styles.locationName}>{order?.restaurant?.name}</Text>
            <Text style={styles.locationAddr}>{order?.restaurant?.address}</Text>
          </View>
          <TouchableOpacity onPress={() => order?.restaurant?.phone && Linking.openURL(`tel:${order.restaurant.phone}`)}>
            <View style={styles.callBtn}>
              <Ionicons name="call" size={16} color={Colors.primary[500]} />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Customer */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={() => openMaps(order?.delivery_address?.latitude, order?.delivery_address?.longitude)}
        >
          <View style={[styles.locationDot, { backgroundColor: Colors.status.success }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Deliver to</Text>
            <Text style={styles.locationName}>{order?.customer?.full_name}</Text>
            <Text style={styles.locationAddr}>
              {order?.delivery_address?.address_line1}, {order?.delivery_address?.city}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => order?.customer?.phone && Linking.openURL(`tel:${order.customer.phone}`)}>
              <View style={styles.callBtn}>
                <Ionicons name="call" size={16} color={Colors.status.success} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Chat', { orderId, otherName: order?.customer?.full_name })}>
              <View style={styles.callBtn}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.dark[700]} />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {nextAction && (
          <Button
            title={nextAction.label}
            onPress={handleUpdateStatus}
            loading={updateStatus.isPending}
            fullWidth
            style={{ marginTop: 8 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  backWrapper: { position: 'absolute', top: 0, left: 0 },
  backBtn: {
    margin: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.light.border,
    alignSelf: 'center', marginBottom: 20,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  orderNum: { fontSize: 18, fontWeight: '800', color: Colors.dark[900] },
  itemsCount: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  locationCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.light.surface, borderRadius: 14,
    padding: 14, marginBottom: 10,
  },
  locationDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  locationLabel: { fontSize: 11, color: Colors.light.textSecondary, fontWeight: '500' },
  locationName: { fontSize: 14, fontWeight: '700', color: Colors.dark[900] },
  locationAddr: { fontSize: 12, color: Colors.dark[600], marginTop: 2 },
  callBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  restaurantPin: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary[500],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  customerPin: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.status.success,
    alignItems: 'center', justifyContent: 'center',
  },
});
