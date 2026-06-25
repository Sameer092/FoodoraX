import * as Location from 'expo-location';
import { supabase } from './supabase';
import type { Coordinates, RiderLocation } from '@types/index';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OSRM = 'https://router.project-osrm.org';

export interface PlaceResult {
  label: string;
  point: Coordinates;
}

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

  // Reverse-geocode (coordinates → readable address) via free Nominatim/OSM.
  async reverseGeocode(coords: Coordinates): Promise<string> {
    try {
      const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1&accept-language=en`;
      const res = await fetch(url, { headers: { 'User-Agent': 'FoodoraX/1.0', Accept: 'application/json' } });
      const data = await res.json();
      const a = data.address ?? {};
      const parts = [a.road, a.suburb ?? a.neighbourhood, a.city ?? a.town ?? a.village].filter(Boolean);
      return parts.join(', ') || data.display_name || '';
    } catch {
      return '';
    }
  },

  async reverseGeocodeDetailed(coords: Coordinates): Promise<{
    line1: string; city: string; postalCode: string;
  } | null> {
    try {
      const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1&accept-language=en`;
      const res = await fetch(url, { headers: { 'User-Agent': 'FoodoraX/1.0', Accept: 'application/json' } });
      const data = await res.json();
      const a = data.address ?? {};
      return {
        line1: [a.house_number, a.road ?? a.pedestrian ?? a.suburb].filter(Boolean).join(' '),
        city: a.city ?? a.town ?? a.village ?? a.state ?? '',
        postalCode: a.postcode ?? '',
      };
    } catch {
      return null;
    }
  },

  async geocodeAddress(address: string): Promise<Coordinates | null> {
    const results = await locationService.searchPlaces(address, 1);
    return results[0]?.point ?? null;
  },

  // Forward-geocode / address search (string → list of places) via Nominatim.
  async searchPlaces(query: string, limit = 6, near?: Coordinates | null): Promise<PlaceResult[]> {
    if (!query.trim()) return [];
    try {
      let url = `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1&accept-language=en`;
      if (near) {
        const d = 0.6; // ~60km bias box
        url += `&viewbox=${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}&bounded=0`;
      }
      const res = await fetch(url, { headers: { 'User-Agent': 'FoodoraX/1.0', Accept: 'application/json' } });
      const data = await res.json();
      return (data as any[]).map((r) => ({
        label: r.display_name as string,
        point: { latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) },
      }));
    } catch {
      return [];
    }
  },

  // Real road route between two points via OSRM (free, no key). Returns the
  // polyline coordinates to draw on the map. Falls back to a straight line.
  async getRoute(from: Coordinates, to: Coordinates): Promise<Coordinates[]> {
    try {
      const url = `${OSRM}/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
      if (coords?.length) {
        return coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
      }
    } catch {
      // fall through to straight line
    }
    return [from, to];
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
    const name = `rider-location-${riderId}`;
    supabase.getChannels()
      .filter((c) => c.topic === `realtime:${name}`)
      .forEach((c) => supabase.removeChannel(c));
    const channel = supabase.channel(name);
    channel
      .on(
        'postgres_changes',
        {
          event: '*', schema: 'public', table: 'rider_locations',
          filter: `rider_id=eq.${riderId}`,
        },
        (payload) => callback(payload.new as RiderLocation)
      )
      .subscribe();
    return channel;
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
