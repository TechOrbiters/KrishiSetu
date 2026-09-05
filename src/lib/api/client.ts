/**
 * KRISHISETU — Centralized API Client
 * Wraps backend endpoints with validation, caching, error handling, and rate-limiting safeguards.
 */

import { LatLng, RouteResult, validateCoordinates } from "../maps/types";
import { calculateHaversineFallback } from "../maps/routing";
import { MarketPriceQueryFilters, MarketPriceApiResponse, MarketPriceSummaryCard } from "../types/market";

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

/**
 * Fetch Government Market Prices (AGMARKNET data.gov.in)
 */
export async function getMarketPrices(filters: MarketPriceQueryFilters = {}): Promise<MarketPriceApiResponse> {
  try {
    const params = new URLSearchParams();
    if (filters.state) params.append("state", filters.state);
    if (filters.district) params.append("district", filters.district);
    if (filters.market) params.append("market", filters.market);
    if (filters.commodity) params.append("commodity", filters.commodity);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const res = await fetch(`/api/market-prices?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Market prices API returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[ApiClient] getMarketPrices error:', err.message);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to connect to market price service.',
      },
    };
  }
}

/**
 * Fetch Top 4 Market Price Summary Cards for Dashboard and Header
 */
export async function getMarketPriceSummary(): Promise<{ success: boolean; data?: MarketPriceSummaryCard[] }> {
  try {
    const res = await fetch('/api/market-prices/summary');
    if (!res.ok) {
      throw new Error(`Market summary API returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[ApiClient] getMarketPriceSummary error:', err.message);
    return { success: false };
  }
}

/**
 * Trigger Market Price Sync from data.gov.in
 */
export async function syncMarketPrices(state: string = 'Uttar Pradesh'): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/market-prices/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, limit: 100 }),
    });
    return await res.json();
  } catch (err: any) {
    console.warn('[ApiClient] syncMarketPrices error:', err.message);
    return { success: false, message: err.message };
  }
}
