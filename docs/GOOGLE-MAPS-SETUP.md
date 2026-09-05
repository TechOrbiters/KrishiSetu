# Google Maps Platform Setup Guide — AI MANDI

## Purpose
Google Maps Platform powers interactive map visualizations, pickup/delivery marker rendering, route previews, and distance/ETA estimates for farmers, transporters, and buyers.

---

## Architecture & Security Classification
- **Classification**: CLIENT SAFE (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- **Allowed Exposure**: Loaded in browser client components via `@googlemaps/js-api-loader` or script tag.
- **Security Restrictions**: MUST use HTTP Referrer restrictions in Google Cloud Console.
  - Allowed Referrers: `http://localhost:3000/*`, `https://aimandi.app/*`
  - Allowed APIs: **Maps JavaScript API**, **Geocoding API**.

---

## Capabilities & Components
1. `<MapComponent />`: Reusable interactive map component supporting pickup, delivery, and live transporter GPS markers.
2. `geocodeAddress()`: Server/client address geocoding for Mandi search and address resolution.
3. `calculateRouteEta()`: Route-based distance and ETA calculation.
4. `calculateHaversineDistance()`: Native client-side straight-line distance approximation (zero cost).

---

## Environment Variables
Add to `.env.local`:
```env
# GOOGLE MAPS (CLIENT SAFE - Browser Key)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy... (HTTP Referrer Restricted)
```

---

## Cost Optimization & Minimality
- Maps API is loaded dynamically only when map components mount.
- Marker location updates are throttled.
- Distance estimation uses native Haversine formula as a primary approximation before invoking full route API calls.
