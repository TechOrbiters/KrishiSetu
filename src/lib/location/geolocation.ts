/**
 * KRISHISETU — Geolocation Module
 * Primary: Browser Geolocation API (Permission-based)
 * Fallback: Manual Location Selector (Village / District / State)
 * Server Fallback: Google Geolocation API (Network-based estimation)
 */

export interface DevicePosition {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  isFallback: boolean;
  source: 'BROWSER_GPS' | 'GOOGLE_GEOLOCATION' | 'MANUAL_SELECTION';
}

export function getCurrentBrowserPosition(): Promise<DevicePosition> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(getManualLocationFallback());
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
        console.warn('Browser geolocation denied or unavailable:', err.message);
        resolve(getManualLocationFallback());
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  });
}

export function getManualLocationFallback(district: string = 'Barabanki'): DevicePosition {
  if (district.toLowerCase().includes('lucknow')) {
    return {
      latitude: 26.8467,
      longitude: 80.9462,
      accuracyMeters: 500,
      isFallback: true,
      source: 'MANUAL_SELECTION',
    };
  }

  // Default Barabanki UP fallback
  return {
    latitude: 26.9038,
    longitude: 81.1852,
    accuracyMeters: 1000,
    isFallback: true,
    source: 'MANUAL_SELECTION',
  };
}

// Server-side Google Geolocation API call (Network/Cell estimation)
export async function getGoogleNetworkLocation(): Promise<DevicePosition> {
  const apiKey = process.env.GOOGLE_GEOLOCATION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return getManualLocationFallback();
  }

  try {
    const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ considerIp: true }),
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();

    if (data.location) {
      return {
        latitude: data.location.lat,
        longitude: data.location.lng,
        accuracyMeters: Math.round(data.accuracy || 1000),
        isFallback: false,
        source: 'GOOGLE_GEOLOCATION',
      };
    }
  } catch (err: any) {
    console.warn('Google Geolocation API fallback:', err.message);
  }

  return getManualLocationFallback();
}
