/**
 * KRISHISETU — OSRM Routing Engine & Haversine Fallback
 * Primary: OSRM (Open Source Routing Machine) API
 * Fallback: Haversine straight-line distance (Explicitly labelled as approximate with NO fake road ETA)
 */

import { LatLng, RouteResult, validateCoordinates } from "./types";

export function calculateHaversineDistance(origin: LatLng, destination: LatLng): number {
  if (!validateCoordinates(origin.lat, origin.lng) || !validateCoordinates(destination.lat, destination.lng)) {
    return 0;
  }
  const R = 6371; // Earth radius in km
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

export function calculateHaversineFallback(origin: LatLng, destination: LatLng): RouteResult {
  const distanceKm = calculateHaversineDistance(origin, destination);
  return {
    success: true,
    provider: "haversine",
    distanceKm,
    durationMinutes: null,
    durationSeconds: null,
    isApproximate: true,
    routeAvailable: false,
    etaAvailable: false,
    geometry: null,
  };
}

export async function calculateRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  // 1. Strict Coordinate Validation
  if (!validateCoordinates(origin.lat, origin.lng) || !validateCoordinates(destination.lat, destination.lng)) {
    return calculateHaversineFallback(origin, destination);
  }

  const osrmBase = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
  const url = `${osrmBase}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5-second timeout safeguard
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn(`[OSRM Routing] HTTP Error ${res.status}`);
      return calculateHaversineFallback(origin, destination);
    }

    const data = await res.json();

    if (data.code === "Ok" && Array.isArray(data.routes) && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationSeconds = Math.round(route.duration);
      const durationMinutes = Math.ceil(durationSeconds / 60);
      const estimatedArrivalIso = new Date(Date.now() + durationSeconds * 1000).toISOString();

      return {
        success: true,
        provider: "osrm",
        distanceKm,
        durationMinutes,
        durationSeconds,
        isApproximate: false,
        routeAvailable: true,
        etaAvailable: true,
        geometry: route.geometry, // GeoJSON LineString
        estimatedArrivalIso,
      };
    }
  } catch (err: any) {
    console.warn("[OSRM Routing] Request failed:", err.message);
  }

  // 2. Strict Fallback: Haversine without fake ETA
  return calculateHaversineFallback(origin, destination);
}
