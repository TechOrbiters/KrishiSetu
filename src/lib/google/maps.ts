/**
 * KRISHISETU — Google Maps Integration Module
 * Handles client-side Maps API loading and server-side geocoding / routing queries.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  durationHours: number;
  durationMinutes: number;
  etaText: string;
  polyline?: string;
  isApproximate: boolean;
}

export interface GeocodeResult {
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
}

// Haversine Distance Fallback Formula (Straight line approximation)
export function calculateHaversineDistance(origin: LatLng, destination: LatLng): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Calculate ETA based on speed (40 km/h average rural road speed)
export function calculateRouteEta(origin: LatLng, destination: LatLng, avgSpeedKmh: number = 40): RouteResult {
  const distanceKm = calculateHaversineDistance(origin, destination);
  const durationHours = Math.round((distanceKm / avgSpeedKmh) * 10) / 10;
  const durationMinutes = Math.round(durationHours * 60);

  return {
    distanceKm,
    durationHours,
    durationMinutes,
    etaText: `${durationMinutes} mins (${distanceKm} km)`,
    isApproximate: true,
  };
}

// Server-side Geocoding helper using Google Maps Geocoding API
export async function geocodeLocationName(locationName: string): Promise<LatLng | null> {
  const result = await geocodeAddress(locationName);
  return result ? result.location : { lat: 26.8467, lng: 80.9462 };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOLOCATION_API_KEY;
  if (!apiKey) {
    // Default fallback for UP Barabanki / Lucknow
    return {
      formattedAddress: address,
      location: { lat: 26.8467, lng: 80.9462 },
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const first = data.results[0];
      const loc = first.geometry.location;
      return {
        formattedAddress: first.formatted_address || address,
        location: { lat: loc.lat, lng: loc.lng },
        placeId: first.place_id,
      };
    }
  } catch (err: any) {
    console.warn("Geocoding warning:", err.message);
  }

  return {
    formattedAddress: address,
    location: { lat: 26.8467, lng: 80.9462 },
  };
}
