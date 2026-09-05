/**
 * KRISHISETU — Browser Geolocation Module
 * Primary: Native Browser Geolocation API (Permission-based navigator.geolocation)
 * Fallback: Manual Location Selector (Village / District / State)
 * Zero external geocoding network dependencies. Non-blocking.
 */

export interface DevicePosition {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  isFallback: boolean;
  source: 'BROWSER_GPS' | 'MANUAL_SELECTION';
  errorDetails?: string;
}

export function getCurrentBrowserPosition(): Promise<DevicePosition> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(getManualLocationFallback('Barabanki', 'Browser geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy),
          isFallback: false,
          source: 'BROWSER_GPS',
        });
      },
      (err) => {
        let errorDetails = 'Geolocation error';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorDetails = 'Permission denied by user';
            break;
          case err.POSITION_UNAVAILABLE:
            errorDetails = 'Position unavailable';
            break;
          case err.TIMEOUT:
            errorDetails = 'Geolocation request timed out';
            break;
        }
        console.warn('[Geolocation] Fallback triggered:', errorDetails);
        resolve(getManualLocationFallback('Barabanki', errorDetails));
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  });
}

export function watchCurrentBrowserPosition(
  onSuccess: (pos: DevicePosition) => void,
  onError?: (err: string) => void
): number | null {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    if (onError) onError('Geolocation not supported');
    return null;
  }

  return navigator.geolocation.watchPosition(
    (pos) => {
      onSuccess({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracyMeters: Math.round(pos.coords.accuracy),
        isFallback: false,
        source: 'BROWSER_GPS',
      });
    },
    (err) => {
      if (onError) onError(err.message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

export function stopWatchingPosition(watchId: number): void {
  if (typeof window !== 'undefined' && navigator.geolocation && watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
}

export function getManualLocationFallback(
  district: string = 'Barabanki',
  reason?: string
): DevicePosition {
  const norm = district.toLowerCase();

  if (norm.includes('lucknow')) {
    return {
      latitude: 26.8467,
      longitude: 80.9462,
      accuracyMeters: 500,
      isFallback: true,
      source: 'MANUAL_SELECTION',
      errorDetails: reason,
    };
  }

  if (norm.includes('kanpur')) {
    return {
      latitude: 26.4499,
      longitude: 80.3319,
      accuracyMeters: 500,
      isFallback: true,
      source: 'MANUAL_SELECTION',
      errorDetails: reason,
    };
  }

  // Default Barabanki UP fallback
  return {
    latitude: 26.9038,
    longitude: 81.1852,
    accuracyMeters: 1000,
    isFallback: true,
    source: 'MANUAL_SELECTION',
    errorDetails: reason,
  };
}
