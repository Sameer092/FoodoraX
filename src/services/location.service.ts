import * as Location from 'expo-location';
import { supabase } from './supabase';
import type { Coordinates, RiderLocation } from '@types/index';

export const locationService = {
  async requestPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async requestBackgroundPermissions() {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<Coordinates> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  },

  async reverseGeocode(coords: Coordinates): Promise<string> {
    const results = await Location.reverseGeocodeAsync(coords);
    if (!results.length) return '';
    const r = results[0];
    return [r.streetNumber, r.street, r.district, r.city].filter(Boolean).join(', ');
  },

  async geocodeAddress(address: string): Promise<Coordinates | null> {
    const results = await Location.geocodeAsync(address);
    if (!results.length) return null;
    return { latitude: results[0].latitude, longitude: results[0].longitude };
  },

  async updateRiderLocation(riderId: string, coords: Coordinates & { heading?: number; speed?: number }) {
    const { error } = await supabase
      .from('rider_locations')
      .upsert({
        rider_id: riderId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        heading: coords.heading,
        speed: coords.speed,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'rider_id' });
    if (error) throw error;
  },

  async getRiderLocation(riderId: string): Promise<RiderLocation | null> {
    const { data, error } = await supabase
      .from('rider_locations')
      .select('*')
      .eq('rider_id', riderId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as RiderLocation | null;
  },

  subscribeToRiderLocation(riderId: string, callback: (loc: RiderLocation) => void) {
    return supabase
      .channel(`rider-location-${riderId}`)
      .on(
        'postgres_changes',
        {
          event: '*', schema: 'public', table: 'rider_locations',
          filter: `rider_id=eq.${riderId}`,
        },
        (payload) => callback(payload.new as RiderLocation)
      )
      .subscribe();
  },

  startLocationTracking(
    callback: (coords: Coordinates) => void,
    intervalMs = 5000
  ) {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: intervalMs,
          distanceInterval: 10,
        },
        (loc) =>
          callback({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
      );
    })();

    return () => subscription?.remove();
  },

  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371;
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
};

function toRad(deg: number) { return deg * (Math.PI / 180); }
