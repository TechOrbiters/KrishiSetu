# Geolocation Capabilities Setup Guide — AI MANDI

## Purpose
Geolocation in AI MANDI resolves farmer, buyer, and transporter position data for pickup location, market recommendations, and live transit tracking.

---

## Architecture & Hierarchy
1. **Primary (Default)**: Browser Geolocation API (`navigator.geolocation.getCurrentPosition`)
   - Triggered only after explicit user permission request.
   - Purpose-specific location acquisition.
   - Client-side zero cost.
2. **Fallback**: Manual Village/District/State/PIN Selection
   - Triggered when browser geolocation is denied or unavailable.
   - Ensures core marketplace features are never blocked.
3. **Google Geolocation API (Server Fallback)**:
   - Used ONLY when technical architecture explicitly requires network-based estimation (cell tower/Wi-Fi positioning).
   - Server-only API key: `GOOGLE_GEOLOCATION_API_KEY`.

---

## Privacy & Security Rules
- Location access is permission-based and authenticated.
- Transporter live location is only exposed to authorized order tracking sessions.
- Exact current coordinates of farmers are never leaked publicly to unrelated users.

---

## Environment Variables
Add to `.env.local`:
```env
# GOOGLE GEOLOCATION — SERVER ONLY
GOOGLE_GEOLOCATION_API_KEY=AIzaSy... (Keep secret)
```

---

## Testing Verification
Run integration test suite:
```bash
npm run test:thirdparty
```
Verifies browser GPS acquisition, manual fallback, and server-side position resolution.
