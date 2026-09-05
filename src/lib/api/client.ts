/**
 * KRISHISETU — Centralized API Client
 * Wraps backend endpoints with validation, caching, error handling, and rate-limiting safeguards.
 */

import { LatLng, RouteResult, validateCoordinates } from "../maps/types";
import { calculateHaversineFallback } from "../maps/routing";

// Simple in-memory cache for recent route queries (TTL: 60 seconds)
const routeCache = new Map<string, { result: RouteResult; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;

export async function getRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  // Validate coordinates before making request
  if (!validateCoordinates(origin.lat, origin.lng) || !validateCoordinates(destination.lat, destination.lng)) {
    return calculateHaversineFallback(origin, destination);
  }

  // Generate unique cache key (rounded to 4 decimal places ~ 11 meters)
  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    const params = new URLSearchParams({
      originLat: origin.lat.toString(),
      originLng: origin.lng.toString(),
      destLat: destination.lat.toString(),
      destLng: destination.lng.toString(),
    });

    const res = await fetch(`/api/location/route?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Route API returned HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.success && json.data) {
      const result: RouteResult = json.data;
      routeCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
  } catch (err: any) {
    console.warn('[ApiClient] getRoute error:', err.message);
  }

  // Fallback if API fails
  const fallback = calculateHaversineFallback(origin, destination);
  routeCache.set(cacheKey, { result: fallback, timestamp: Date.now() });
  return fallback;
}
