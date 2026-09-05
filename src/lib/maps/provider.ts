/**
 * KRISHISETU — Map & Routing Provider Abstraction
 * Clean architecture separating Map Rendering, OSRM Routing, Location, and Realtime Tracking.
 */

import { LatLng, RouteResult } from "./types";
import { calculateRoute } from "./routing";

export interface RoutingProvider {
  calculateRoute(origin: LatLng, destination: LatLng): Promise<RouteResult>;
}

export class OSRMRoutingProviderImpl implements RoutingProvider {
  async calculateRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
    return calculateRoute(origin, destination);
  }
}

export interface MapTileProviderConfig {
  tileUrl: string;
  attribution: string;
  maxZoom: number;
}

export function getMapTileConfig(): MapTileProviderConfig {
  return {
    tileUrl:
      process.env.NEXT_PUBLIC_MAP_TILE_URL ||
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  };
}

export const activeRoutingProvider: RoutingProvider = new OSRMRoutingProviderImpl();
