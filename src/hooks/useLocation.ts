import { useState, useEffect, useCallback } from 'react';
import { locationService } from '@services/location.service';
import { useAppStore } from '@store/app.store';
import type { Coordinates } from '@types/index';

export function useLocation() {
  const { currentLocation, setCurrentLocation } = useAppStore();
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const granted = await locationService.requestPermissions();
      if (!granted) {
        setError('Location permission denied');
        return;
      }
      const coords = await locationService.getCurrentLocation();
      setCurrentLocation(coords);
      const addr = await locationService.reverseGeocode(coords);
      setAddress(addr);
    } catch (e) {
      setError('Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentLocation]);

  useEffect(() => {
    if (!currentLocation) fetchLocation();
  }, [currentLocation, fetchLocation]);

  return { location: currentLocation, address, isLoading, error, refetch: fetchLocation };
}

export function useRiderLocationTracking(riderId: string | undefined, active: boolean) {
  const { currentLocation, setCurrentLocation } = useAppStore();

  useEffect(() => {
    if (!riderId || !active) return;

    const stop = locationService.startLocationTracking(async (coords) => {
      setCurrentLocation(coords);
      try {
        await locationService.updateRiderLocation(riderId, coords);
      } catch {
        // silently ignore location update failures
      }
    });

    return stop;
  }, [riderId, active, setCurrentLocation]);

  return currentLocation;
}
