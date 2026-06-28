import * as Location from 'expo-location';
import { supabase, removeChannel } from '@library/supabase';
import { NOMINATIM, OSRM } from '@config/constant';

export async function requestPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation() {
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

export async function reverseGeocode(coords) {
  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1&accept-language=en`;
    const res = await fetch(url, { headers: { 'User-Agent': 'FoodoraX/1.0', Accept: 'application/json' } });
    const data = await res.json();
    const a = data.address || {};
    const parts = [a.road, a.suburb || a.neighbourhood, a.city || a.town || a.village].filter(Boolean);
    return parts.join(', ') || data.display_name || '';
  } catch {
    return '';
  }
}

export async function reverseGeocodeDetailed(coords) {
  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1&accept-language=en`;
    const res = await fetch(url, { headers: { 'User-Agent': 'FoodoraX/1.0', Accept: 'application/json' } });
    const data = await res.json();
    const a = data.address || {};
    return {
      line1: [a.house_number, a.road || a.pedestrian || a.suburb].filter(Boolean).join(' '),
      city: a.city || a.town || a.village || a.state || '',
      postalCode: a.postcode || '',
    };
  } catch {
    return null;
  }
}

export async function searchPlaces(query, near) {
  if (!query || !query.trim()) return [];
  try {
    let url = `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=6&addressdetails=1&accept-language=en`;
    if (near) {
      const d = 0.6;
      url += `&viewbox=${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}&bounded=0`;
    }
    const res = await fetch(url, { headers: { 'User-Agent': 'FoodoraX/1.0', Accept: 'application/json' } });
    const data = await res.json();
    return data.map((r) => ({
      label: r.display_name,
      point: { latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) },
    }));
  } catch {
    return [];
  }
}

export async function geocodeAddress(address) {
  const results = await searchPlaces(address);
  return results[0] ? results[0].point : null;
}

export async function getRoute(from, to) {
  try {
    const url = `${OSRM}/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords = data && data.routes && data.routes[0] && data.routes[0].geometry.coordinates;
    if (coords && coords.length) {
      return coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
    }
  } catch {
    // fall through
  }
  return [from, to];
}

export function calculateDistance(from, to) {
  const R = 6371;
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function updateRiderLocation(riderId, coords) {
  await supabase.from('rider_locations').upsert(
    { rider_id: riderId, latitude: coords.latitude, longitude: coords.longitude, updated_at: new Date().toISOString() },
    { onConflict: 'rider_id' },
  );
}

export async function getRiderLocation(riderId) {
  const { data } = await supabase.from('rider_locations').select('*').eq('rider_id', riderId).maybeSingle();
  return data;
}

export function subscribeToRiderLocation(riderId, callback) {
  const name = `rider-location-${riderId}`;
  supabase.getChannels().filter((c) => c.topic === `realtime:${name}`).forEach((c) => removeChannel(c));
  const channel = supabase.channel(name);
  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_locations', filter: `rider_id=eq.${riderId}` }, (payload) => callback(payload.new))
    .subscribe();
  return channel;
}

export function startLocationTracking(callback, intervalMs = 5000) {
  let subscription = null;
  (async () => {
    subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: intervalMs, distanceInterval: 10 },
      (loc) => callback({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
    );
  })();
  return () => subscription && subscription.remove();
}
