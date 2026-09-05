# KRISHISETU — Open Map Stack Architecture & Technical Specification

## Overview

KRISHISETU uses a fully open-source, provider-agnostic mapping, routing, and location stack:
- **Map Renderer**: Leaflet (`LeafletMapInner.tsx`)
- **Map Tiles**: OpenStreetMap (`NEXT_PUBLIC_MAP_TILE_URL`)
- **Routing Engine**: OSRM (`OSRM_BASE_URL` -> `src/lib/maps/routing.ts`)
- **Location Provider**: Native Browser Geolocation API (`navigator.geolocation`)
- **Realtime Tracking**: Firebase Realtime Database (`transporterLocation` + `updatedAt`)
- **Freshness Decision**: FreshRoute Service (`src/lib/domain/freshroute.ts`)
- **Produce Photo AI**: Google Cloud Vision (Independent, untouched)

---

## Architectural Principles & Responsibilities

```
+------------------------------------------------------------------------+
|                          KRISHISETU CLIENT                             |
|                                                                        |
|  Browser Geolocation                Leaflet Renderer                   |
|  (navigator.geolocation)            (Map, Markers, Polyline, Bounds)   |
+-----------------------------------^------------------------------------+
                                    |
                                    | Route Data
                                    v
+------------------------------------------------------------------------+
|                            BACKEND API                                 |
|                                                                        |
|  /api/location/route  ---->  RoutingProvider (OSRM Engine)             |
|                                     ↓                                  |
|                             FreshRoute Service                         |
|                             (SAFE / AT_RISK / INELIGIBLE)              |
+------------------------------------------------------------------------+
                                    ^
                                    | Transporter Coordinates
                                    v
+------------------------------------------------------------------------+
|                        FIREBASE REALTIME DB                            |
|  Transporter Live Coordinates & Timestamp (updatedAt)                  |
+------------------------------------------------------------------------+
```

### 1. Leaflet (Visual Renderer Only)
- Renders OpenStreetMap tiles with visible attribution `© OpenStreetMap contributors`.
- Displays pickup pin (emerald), destination pin (red), and live transporter pin (truck badge).
- Draws route polylines based on GeoJSON `LineString` coordinates returned by OSRM.
- Contains zero business logic, zero freshness rules, and zero payment/authorization checks.
- SSR safe with dynamic loading (`ssr: false`) and strict unmount cleanup (`map.remove()`).

### 2. OSRM (Routing Engine)
- Endpoint: `OSRM_BASE_URL` (default: `https://router.project-osrm.org`).
- Computes road route, road distance, duration in seconds/minutes, and GeoJSON geometry.
- If OSRM fails or coordinates are invalid, falls back to straight-line Haversine distance explicitly labelled as `isApproximate: true`, `routeAvailable: false`, and `durationMinutes: null`. **No fake road ETAs are ever generated from Haversine.**

### 3. Native Browser Geolocation
- Primary: `navigator.geolocation` with high accuracy mode and 6-second timeout.
- Fallback: Local known-location dictionary (Barabanki / Lucknow) and manual dropdown selector.
- Non-blocking: Marketplace navigation functions fully if location permission is denied.

### 4. Realtime Transporter Location & Stale Check
- Transporter device pushes live lat/lng + `updatedAt` Unix timestamp to Firebase Realtime Database.
- If `updatedAt` age > 5 minutes, UI displays "Last updated X minutes ago" / "अंतिम अपडेट X मिनट पहले" instead of "Live".

### 5. FreshRoute Service Rules
- Inputs: `harvestTimeIso`, `freshnessDurationHours`, `routeDurationMinutes`, `safetyBufferMinutes`.
- `SAFE`: ETA <= deadline - safetyBuffer.
- `AT_RISK`: ETA <= deadline AND ETA > deadline - safetyBuffer (Requires explicit farmer/buyer confirmation).
- `INELIGIBLE`: ETA > deadline (Option disabled / blocked).

---

## Environment Variables

| Variable | Description | Default | Scope |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_MAP_TILE_URL` | OpenStreetMap HTTPS tile pattern | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Client / Public |
| `OSRM_BASE_URL` | OSRM routing base URL | `https://router.project-osrm.org` | Server / API |
| `GOOGLE_VISION_API_KEY` | Google Cloud Vision API Key | Secret | Server Only |

---

## Code Base Map File Structure

```
src/
├── lib/
│   ├── maps/
│   │   ├── types.ts          # LatLng, RouteResult, validateCoordinates, checkLocationStale
│   │   ├── routing.ts        # OSRM API client & Haversine fallback engine
│   │   └── provider.ts       # OSRMRoutingProviderImpl & MapTileConfig abstraction
│   ├── location/
│   │   └── geolocation.ts    # Native navigator.geolocation & manual fallback dictionary
│   ├── domain/
│   │   └── freshroute.ts     # FreshRoute SAFE / AT_RISK / INELIGIBLE decision rules
│   └── api/
│       └── client.ts         # getRoute API client with in-memory TTL caching
├── components/
│   └── maps/
│       ├── LeafletMapInner.tsx # Pure Leaflet map renderer (SSR-safe, markers, polyline)
│       ├── LiveTrackingMap.tsx # Tracking card wrapper (OSRM client, stale badge)
│       └── MapComponent.tsx    # Re-export shim for backward compatibility
└── app/
    └── api/
        └── location/
            ├── route/route.ts  # GET /api/location/route OSRM endpoint
            └── geocode/route.ts# GET /api/location/geocode local dictionary endpoint
```
