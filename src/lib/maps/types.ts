/**
 * KRISHISETU — Open Map Stack Type Definitions
 * Strict contracts for Leaflet, OSRM routing, Geolocation, and Realtime Tracking.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoJSONGeometry {
  type: "LineString";
  coordinates: [number, number][]; // [longitude, latitude]
}

export interface RouteResult {
  success: boolean;
  provider: "osrm" | "haversine";
  distanceKm: number;
  durationMinutes: number | null;
  durationSeconds: number | null;
  isApproximate: boolean;
  routeAvailable: boolean;
  etaAvailable: boolean;
  geometry: GeoJSONGeometry | null;
  estimatedArrivalIso?: string;
  error?: string;
}

export interface TrackingLocation extends LatLng {
  label: string;
  address: string;
}

export interface TransporterLiveLocation extends LatLng {
  updatedAt: number; // Unix timestamp in milliseconds
  transporterId?: string;
}

export interface LocationStaleStatus {
  isStale: boolean;
  timeAgoText: string;
  ageMinutes: number;
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function checkLocationStale(
  updatedAtMs: number,
  staleThresholdMinutes: number = 5
): LocationStaleStatus {
  const now = Date.now();
  const diffMs = Math.max(0, now - updatedAtMs);
  const ageMinutes = Math.floor(diffMs / (1000 * 60));
  const isStale = ageMinutes >= staleThresholdMinutes;

  let timeAgoText = "अभी-अभी";
  if (ageMinutes >= 60) {
    const hours = Math.floor(ageMinutes / 60);
    timeAgoText = `${hours} घंटे पहले`;
  } else if (ageMinutes > 0) {
    timeAgoText = `${ageMinutes} मिनट पहले`;
  }

  return { isStale, timeAgoText, ageMinutes };
}
