import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface LocationState {
  status: LocationStatus;
  coords: { latitude: number; longitude: number } | null;
  error: string | null;
}

const DEFAULT_COORDS = { latitude: 38.627, longitude: -90.1994 }; // Downtown STL fallback

export function useCurrentLocation(options: { fallbackToSTL?: boolean } = {}) {
  const { fallbackToSTL = true } = options;
  const [state, setState] = useState<LocationState>({
    status: 'idle',
    coords: null,
    error: null,
  });
  const requestedRef = useRef(false);

  const request = useCallback(async () => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    setState((s) => ({ ...s, status: 'requesting', error: null }));
    try {
      const services = await Location.hasServicesEnabledAsync();
      if (!services) {
        setState({
          status: 'unavailable',
          coords: fallbackToSTL ? DEFAULT_COORDS : null,
          error: 'Location services are off on this device.',
        });
        return;
      }
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setState({
          status: 'denied',
          coords: fallbackToSTL ? DEFAULT_COORDS : null,
          error: 'Location permission was denied.',
        });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState({
        status: 'granted',
        coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        error: null,
      });
    } catch (err) {
      setState({
        status: 'error',
        coords: fallbackToSTL ? DEFAULT_COORDS : null,
        error: err instanceof Error ? err.message : 'Unable to get location.',
      });
    }
  }, [fallbackToSTL]);

  useEffect(() => {
    request();
  }, [request]);

  const retry = useCallback(() => {
    requestedRef.current = false;
    request();
  }, [request]);

  return { ...state, retry };
}
